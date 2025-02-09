"use client"
// FileList.jsx
import { useState, useCallback, useEffect, useRef } from "react";
import { MoreVertical, AlertCircle } from "lucide-react";
import { Upload } from "lucide-react";
import { addPdf, getAllPdfs } from "@/db/pdf/docs";
import FileSystem from "@/components/FileSystem";
import { v4 as uuidv4 } from "uuid";
import {useRouter} from "next/navigation";

const FileList = ({ files }:{files:any}) => {
  return (
    <div className="w-full h-full py-2 px-8 overflow-y-auto mb-6 scrollbar-hide">
      {files.map((file:any, index:number) => (
        <div
          key={index}
          className="flex items-center justify-between px-4 py-3 hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="text-blue-500">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{file.uploadTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {file.status === "error" ? (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="font-medium">Error</span>
              </div>
            ) : (
              <span className="text-sm text-gray-600 font-medium">
                {file.size}
              </span>
            )}
            <button className="p-1 hover:bg-gray-200 rounded-full">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// FileUpload.jsx

const FileUpload = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [files, setFiles] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [documentId, setDocumentId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [file, setfile] = useState();

  const router = useRouter();

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = async (newFiles) => {
    const id = uuidv4();
    const filesWithProgress = newFiles.map((file) => ({
      id: id,
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
      status: "uploading",
      uploadTime: "Just now",
      file, // Include the actual file object
    }));

    setDocumentId(id);
    setfile(filesWithProgress[0]);
    setFileName(newFiles[0].name);

    setUploadingFiles((prev) => [...prev, ...filesWithProgress]);

    // for (const file of filesWithProgress) {
    //   await uploadFile(file);
    // }
  };

  const saveFile = async () => {
    await uploadFile(file);
  };


  const uploadFile = async (file) => {
    const reader = new FileReader();
  
    reader.onload = async (event) => {
      try {
        // Convert file to base64
        const base64 = event.target.result;
  
        // Store file in IndexedDB
        await addPdf({
          documentId: file.id,
          name: file.name,
          size: file.size,
          uploadTime: new Date().toLocaleString(),
          base64, // Save the base64-encoded content
          status: "complete",
        });
  
        // Upload file to the external backend
        // const response = await fetch("http://localhost:5000/upload", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({
        //     documentId: file.id,
        //     name: file.name,
        //     size: file.size,
        //     base64, // Send the base64-encoded content
        //   }),
        // });
  
        // if (!response.ok) {
        //   throw new Error("Failed to upload file to backend");
        // }
  
        // const result = await response.json();
        // console.log("File uploaded successfully:", result);

        router.push(`/pdftest/${file.id}`)
  
        // Update state to reflect completion
        setUploadingFiles((prev) => prev.filter((f) => f.id !== file.id));
        setFiles((prev) => [
          {
            id: file.id,
            name: file.name,
            size: file.size,
            uploadTime: new Date().toLocaleString(),
            status: "complete",
          },
          ...prev,
        ]);
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f))
        );
      }
    };
  
    reader.onerror = () => {
      console.error("Error reading file:", reader.error);
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f))
      );
    };
  
    reader.readAsDataURL(file.file);
  };
  
  

  // const uploadFile = async (file) => {
  //   const reader = new FileReader();

  //   reader.onload = async (event) => {
  //     try {
  //       // Convert file to base64
  //       const base64 = event.target.result;

  //       // Store file in IndexedDB
  //       await addPdf({
  //         documentId: file.id,
  //         name: file.name,
  //         size: file.size,
  //         uploadTime: new Date().toLocaleString(),
  //         base64, // Save the base64-encoded content
  //         status: "complete",
  //       });

  //       // Update state to reflect completion
  //       setUploadingFiles((prev) => prev.filter((f) => f.id !== file.id));
  //       setFiles((prev) => [
  //         {
  //           id: file.id,
  //           name: file.name,
  //           size: file.size,
  //           uploadTime: new Date().toLocaleString(),
  //           status: "complete",
  //         },
  //         ...prev,
  //       ]);
  //     } catch (error) {
  //       console.error("Error uploading file:", error);
  //       setUploadingFiles((prev) =>
  //         prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f))
  //       );
  //     }
  //   };

  //   reader.onerror = () => {
  //     console.error("Error reading file:", reader.error);
  //     setUploadingFiles((prev) =>
  //       prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f))
  //     );
  //   };

  //   reader.readAsDataURL(file.file);
  // };

  // Utility function for formatting file size
  const formatFileSize = (size) => {
    return size < 1024
      ? size + " bytes"
      : size < 1048576
      ? (size / 1024).toFixed(2) + " KB"
      : (size / 1048576).toFixed(2) + " MB";
  };

  // Example function to fetch all files from IndexedDB
  const fetchFilesFromIndexedDB = async () => {
    const pdfs = await getAllPdfs();
    setFiles(pdfs);
  };

  useEffect(() => {
    fetchFilesFromIndexedDB();
  }, []);

  const clearUploads = () => {
    setUploadingFiles([]);
  };

  return (
    <div className="w-[1095px] h-[456px] font-rubik">
      <div className="flex gap-2 bg-[#F6F7F9] w-fit p-2 rounded-full mb-6">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-6 py-2.5 rounded-full text-md font-medium transition-colors ${
            activeTab === "upload"
              ? "bg-[#38A169] text-white"
              : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          New Upload
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`px-6 py-2.5 rounded-full text-md font-medium transition-colors ${
            activeTab === "recent"
              ? "bg-[#38A169] text-white"
              : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          Recent
        </button>
      </div>

      <div className="w-[1095px] h-[398px] bg-[#F6F7F9] rounded-xl flex flex-col items-center justify-center">
        {activeTab === "upload" && (
          <div className="">
            <input
              type="file"
              id="fileInput"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            <label
              htmlFor="fileInput"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed w-[1004px] h-[246px] rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <Upload
                className={`w-6 h-6 mb-3 ${
                  isDragging ? "text-emerald-500" : "text-gray-400"
                }`}
              />
              <p
                className={`text-lg text-center font-bold ${
                  isDragging ? "text-emerald-500" : "text-gray-400"
                }`}
              >
                Click to browse or<br/> drag and drop your files
              </p>
            </label>

            {/* Uploading Files Progress */}
            {uploadingFiles.length > 0 && (
              <div className="mt-6 space-y-4">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-500">
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(file.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex w-full justify-end px-10 gap-3 mt-6">
              <button
                onClick={clearUploads}
                className="px-6 py-2.5 rounded-lg bg-[#c7c7c7] text-gray-600 hover:bg-gray-300 text-sm font-medium"
              >
                Clear Upload
              </button>
              <button className="px-6 py-2.5 rounded-lg bg-gradient-to-b from-emerald-700 to-[#38a169] text-white hover:bg-emerald-600 text-sm font-medium">
                Upload Pdf
              </button>
            </div>
          </div>
        )}

        {activeTab === "recent" && <FileList files={files} />}
      </div>

      {uploadingFiles.length > 0 && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-[#464444a0]  backdrop-blur-sm flex justify-center items-center"
          style={{ zIndex: 100 }}
        >
          <div className="max-w-[1095px] max-h-[917px] w-full mb-[15vw] rounded-xl overflow-auto">
            <FileSystem
              currentPath={currentPath}
              setCurrentPath={setCurrentPath}
              fileType="pdf"
              file={{
                documentId,
                fileName,
              }}
              saveFile={saveFile}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

// FileUploadWrapper Component
export const FileUploadWrapper = ({ isUploadPdf, setIsOpen, fileType }) => {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [showFileSystem, setShowFileSystem] = useState(false);
  const fileInputRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleFiles = async (newFiles) => {
    const id = uuidv4();
    const filesWithProgress = newFiles.map((file) => ({
      id: id,
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
      status: "uploading",
      uploadTime: "Just now",
      file,
    }));
    setShowFileSystem(true);

    setDocumentId(id);
    setFile(filesWithProgress[0]);

    setFileName(newFiles[0].name);

    setUploadingFiles((prev) => [...prev, ...filesWithProgress]);
  };

  const saveFile = async () => {
    if (!file) {
      setShowFileSystem(false);
      setIsOpen(false);
      return;
    }
    await uploadFile(file);
    setShowFileSystem(false);
    setIsOpen(false);
  };

  const handleOutsideClick = (e) => {
    if (e.target.classList.contains("bg-black")) {
      setShowFileSystem(false);
      setUploadingFiles([]);
      setIsOpen(false);
    }
  };

  const uploadFile = async (file) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const base64 = event.target.result;
        await addPdf({
          documentId: file.id,
          name: file.name,
          size: file.size,
          uploadTime: new Date().toLocaleString(),
          base64,
          status: "complete",
        });

        setUploadingFiles((prev) => prev.filter((f) => f.id !== file.id));
        setFiles((prev) => [
          {
            id: file.id,
            name: file.name,
            size: file.size,
            uploadTime: new Date().toLocaleString(),
            status: "complete",
          },
          ...prev,
        ]);
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f))
        );
      }
    };

    reader.onerror = () => {
      console.error("Error reading file:", reader.error);
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f))
      );
    };

    reader.readAsDataURL(file.file);
  };

  const formatFileSize = (size) => {
    return size < 1024
      ? size + " bytes"
      : size < 1048576
      ? (size / 1024).toFixed(2) + " KB"
      : (size / 1048576).toFixed(2) + " MB";
  };

  const fetchFilesFromIndexedDB = async () => {
    const pdfs = await getAllPdfs();
    setFiles(pdfs);
  };

  useEffect(() => {
    fetchFilesFromIndexedDB();
  }, []);

  // Modified effect to prevent double triggering
  useEffect(() => {
    if (fileType === "note") {
      const id = uuidv4();
      setShowFileSystem(true);
      setFileName(id);
      setDocumentId(id);
      return;
    }
    if (
      isUploadPdf &&
      uploadingFiles.length === 0 &&
      !hasTriggeredRef.current
    ) {
      hasTriggeredRef.current = true;
      fileInputRef.current?.click();
    }

    // Reset the trigger state when isUploadPdf becomes false
    if (!isUploadPdf) {
      hasTriggeredRef.current = false;
    }

    // Cleanup function
    return () => {
      if (!isUploadPdf) {
        hasTriggeredRef.current = false;
      }
    };
  }, [isUploadPdf, uploadingFiles.length]);

  return (
    <div className="cursor-pointer">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept=".pdf"
      />
      {showFileSystem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center"
          style={{ zIndex: 10 }}
          onClick={handleOutsideClick}
        >
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br opacity-80 "></div>

          {/* Main Content Container */}
          <div className="relative w-4/5 max-w-2xl rounded-lg shadow-lg p-6 z-20 ">
            <FileSystem
              currentPath={currentPath}
              setCurrentPath={setCurrentPath}
              fileType={fileType}
              file={{
                documentId,
                fileName,
              }}
              saveFile={saveFile}
              onClose={() => {
                setShowFileSystem(false);
                setUploadingFiles([]);
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
