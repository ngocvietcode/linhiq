async sendMessage(sessionId, body, req, res) {
        try {
            const input = validators_1.sendMessageSchema.parse(body);
            const session = await this.chat.getSession(sessionId, req.user.sub);
            if (!session) {
                throw new common_1.NotFoundException('Session not found');
            }
            const { category, shouldRedirect } = await this.ai.classifySafeChat(input.content);
            await this.chat.saveMessage(sessionId, 'user', input.content, {
                safeCategory: category,
            });
            if (!session.title) {
                const title = input.content.length > 50
                    ? input.content.substring(0, 47) + '...'
                    : input.content;
                await this.chat.updateSessionTitle(sessionId, title);
            }
            const history = session.messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));
            const dbHintLevel = input.hintLevel === 3 ? database_1.HintLevel.L3 : input.hintLevel === 2 ? database_1.HintLevel.L2 : database_1.HintLevel.L1;
            let aiResponse;
            if (shouldRedirect) {
                aiResponse = await this.ai.streamGentleRedirect(input.content, category);
            }
            else {
                aiResponse = await this.ai.streamChat({
                    userMessage: input.content,
                    chatHistory: history,
                    subjectId: session.subjectId ?? '',
                    subjectName: session.subject?.name ?? 'General',
                    curriculum: session.subject?.curriculum ?? 'GENERAL',
                    hintLevel: input.hintLevel,
                });
            }
            const { stream, metadata } = aiResponse;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            let fullResponse = '';
            try {
                for await (const chunk of stream.textStream) {
                    fullResponse += chunk;
                    res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
                }
                res.write(`data: ${JSON.stringify({ type: 'done', metadata })}\n\n`);
                const tokenUsage = await stream.usage;
                await this.chat.saveMessage(sessionId, 'assistant', fullResponse, {
                    hintLevel: dbHintLevel,
                    modelUsed: metadata?.provider,
                    ragSources: metadata?.ragSources?.map((r) => r.chunkId),
                    tokensUsed: tokenUsage?.totalTokens,
                    wasRedirected: metadata?.wasRedirected,
                    safeCategory: metadata?.safeCategory,
                });
            }
            catch (error) {
                console.error('LLM Stream Error:', error);
            