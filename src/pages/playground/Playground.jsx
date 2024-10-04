import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, ChevronDown } from "lucide-react";
import MainNavbar from "../../components/MainNavbar";

const JUDGE0_API_KEY = import.meta.env.VITE_JUDGE0_API_KEY;

const Playground = () => {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(
          "https://judge0-ce.p.rapidapi.com/languages",
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              "X-RapidAPI-Key": JUDGE0_API_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const sortedLanguages = data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setLanguages(sortedLanguages);
        setLanguage(sortedLanguages[0]); // Set the first language as default
      } catch (error) {
        console.error("Error fetching languages:", error);
        setOutput("Error fetching languages. Please try again later.");
      }
    };

    fetchLanguages();
  }, []);

  const runCode = async () => {
    if (!language) {
      setOutput("Please select a language first.");
      return;
    }

    setIsRunning(true);
    setOutput("");
    try {
      if (code === "") {
        throw Error("Your Code is Empty , Type Something and then try");
      }

      const submissionResponse = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "X-RapidAPI-Key": JUDGE0_API_KEY,
          },
          body: JSON.stringify({
            language_id: language.id,
            source_code: code,
            stdin: input,
          }),
        }
      );

      if (!submissionResponse.ok) {
        throw new Error(`HTTP error! status: ${submissionResponse.status}`);
      }

      const { token } = await submissionResponse.json();

      let result;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusResponse = await fetch(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`,
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              "X-RapidAPI-Key": JUDGE0_API_KEY,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error(`HTTP error! status: ${statusResponse.status}`);
        }

        result = await statusResponse.json();

        if (result.status.id > 2) {
          break;
        }

        attempts++;
      }

      if (attempts === maxAttempts) {
        throw new Error("Timed out waiting for code execution");
      }

      if (result.stdout) {
        setOutput(atob(result.stdout));
      } else if (result.stderr) {
        setOutput(`Error: ${atob(result.stderr)}`);
      } else if (result.compile_output) {
        setOutput(`Compilation Error: ${atob(result.compile_output)}`);
      } else {
        setOutput("No output generated.");
      }
    } catch (error) {
      console.error("Error:", error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <MainNavbar />

      <main className="container mx-auto px-6 py-12">
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold mb-4">Quick Compiler</h1>
          <p className="text-xl">
            Write, compile, and run your code instantly!
          </p>
        </motion.section>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-fit px-4 py-2 text-sm font-medium text-white bg-purple-800 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-purple-500"
                >
                  {language ? language.name : "Select Language"}
                  <ChevronDown className="ml-2 h-5 w-5" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-purple-800 ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => {
                            setLanguage(lang);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-700"
                          role="menuitem"
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={runCode}
                disabled={isRunning || !language}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  isRunning || !language
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-yellow-400 text-purple-900 hover:bg-yellow-300"
                }`}
              >
                {isRunning ? "Running..." : "Run Code"}
                <Play className="ml-2 h-4 w-4" />
              </button>
            </div>
            <textarea
              className="w-full h-72 p-4 bg-purple-800 bg-opacity-50 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your code here..."
            />
            <textarea
              className="w-full h-24 p-4 bg-purple-800 bg-opacity-50 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your program input here..."
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Output</h2>
            <pre className="w-full h-96 p-4 bg-purple-800 bg-opacity-50 rounded-lg overflow-auto text-white">
              {output || "Your output will appear here..."}
            </pre>
          </div>
        </motion.div>
      </main>

      <footer className="bg-purple-900 bg-opacity-50 py-10 backdrop-blur-lg mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-300">
            © 2024 Codeteria. All rights reserved.
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default Playground;
