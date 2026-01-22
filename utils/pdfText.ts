
import { spawn } from "node:child_process";

/**
 * Extracts searchable text from a PDF buffer using the `pdftotext` command (from poppler-utils).
 *
 * How it works:
 * - Streams the PDF bytes directly to pdftotext via stdin (no need to write a temp file to disk)
 * - Returns the extracted text as a string
 * - Works in Docker and CI environments (just ensure poppler-utils is installed)
 *
 * Example usage:
 *   const pdfBytes = fs.readFileSync("downloads/origin-plan.pdf");
 *   const text = await getPdfText(pdfBytes);
 *   console.log(text);
 */
export const getPdfText = async (pdfBytes: Buffer): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
  // -layout preserves the original PDF layout as much as possible
  // The first '-' tells pdftotext to read the PDF from standard input (stdin),
  // and the second '-' tells it to write the extracted text to standard output (stdout).
  // This means we can stream the PDF bytes directly to the process and read the text result without using any files.
    const proc = spawn("pdftotext", ["-layout", "-", "-"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    // Set encoding for stdout and stderr so that we can read the text output as a string
    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");

    // Capture stdout and stderr so that we can return or log them
    proc.stdout.on("data", (chunk) => (stdout += chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk));

    proc.on("error", (err: any) => {
      // ENOENT means pdftotext is not installed or not found in PATH
      if (err?.code === "ENOENT") {
        reject(
          new Error(
            "pdftotext not found. Install poppler-utils (Docker: apt-get install -y poppler-utils)."
          )
        );
        return;
      }
      reject(err);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `pdftotext exited with code ${code}. stderr: ${stderr || "(empty)"}`
          )
        );
        return;
      }

      resolve((stdout ?? "").trim());
    });

  // Stream the PDF bytes to pdftotext's stdin and close stdin when done
  proc.stdin.write(pdfBytes);
  proc.stdin.end();
  });
};
