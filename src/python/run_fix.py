import sys
import os
from docx import Document

def run_fix(doc_path, script_code, output_path):
    """
    Executes the provided Python script code to fix a .docx file.
    The script_code is expected to contain a function `fix_document(input_path, output_path)`.
    """
    if not os.path.exists(doc_path):
        print(f"Error: Document not found at {doc_path}")
        sys.exit(1)

    # The generated code is executed in a dictionary to capture the fix_document function
    local_scope = {}
    try:
        # Pass globals including Document to the exec environment
        exec(script_code, {'Document': Document, 'sys': sys}, local_scope)
    except Exception as e:
        print(f"Error executing generated script: {e}")
        sys.exit(1)

    fix_function = local_scope.get('fix_document')

    if callable(fix_function):
        try:
            fix_function(doc_path, output_path)
            print(f"Successfully applied fix. Output saved to {output_path}")
        except Exception as e:
            print(f"Error running fix_document function: {e}")
            sys.exit(1)
    else:
        print("Error: 'fix_document' function not found in generated script.")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python run_fix.py <path_to_docx> <path_to_script_file> <output_path>")
        sys.exit(1)

    doc_path = sys.argv[1]
    script_path = sys.argv[2]
    output_path = sys.argv[3]

    with open(script_path, 'r') as f:
        script_code = f.read()

    run_fix(doc_path, script_code, output_path)
