import os
import glob
from llama_parse import LlamaParse

os.environ["LLAMA_CLOUD_API_KEY"] = "llx-4xn9ODNoVjMWWu3MsyDfs0NxiPknULsr5TtAklFx79YeGgEb"

def main():
    input_dir = r"D:\Projects\Javirs\apps\data\curriculum\igcse\biology\pdf"
    output_dir = r"D:\Projects\Javirs\apps\data\curriculum\igcse\biology\textbook"

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    pdf_files = glob.glob(os.path.join(input_dir, "*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in {input_dir}")
        return

    parser = LlamaParse(
        result_type="markdown",
        verbose=True
    )

    for pdf_file in pdf_files:
        print(f"Parsing {pdf_file} ...")
        filename = os.path.basename(pdf_file)
        name, _ = os.path.splitext(filename)
        output_file = os.path.join(output_dir, f"{name}.md")
        
        try:
            documents = parser.load_data(pdf_file)
            markdown_content = "\n\n".join([doc.text for doc in documents])
            
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(markdown_content)
                
            print(f"Successfully saved markdown to {output_file}")
        except Exception as e:
            print(f"Error parsing {pdf_file}: {e}")

if __name__ == "__main__":
    main()
