
"use client"
import React, { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfFile from "@/public/pdf-file.svg";
import FileNote from "@/public/noteplain.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getFileSystem } from "@/db/pdf/fileSystem";
import { json } from "stream/consumers";
import upoladpdf from '@/public/uploadpdf.svg'
import subjects from '@/public/subjects.svg'

interface FileItem {
  id: string;
  name: string;
  parentId?: string;
  documentId?: string;
  uploadTime?: string;
  type?: string;
  isOpen?: boolean;
  isActive?: boolean;
  files: FileItem[];
}

interface FolderStructure {
  [key: string]: FileItem;
}

interface SubjectsFilesProps {
  fileType: "note" | "pdf";
}

const SubjectsFiles: React.FC<SubjectsFilesProps> = ({ fileType }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const formatFolderStructure = (data: FileItem[], fileType: string): FileItem[] => {
    const folderMap: FolderStructure = {};
    const rootFolders: FileItem[] = [];
  
    // Create a map of all folders and files
    data.forEach((item) => {
      folderMap[item.id] = { 
        ...item, 
        isOpen: false, 
        isActive: false, 
        files: []
      };
    });
  
    // Organize items by parentId and filter files by fileType
    data.forEach((item) => {
      if (item.parentId) {
        // Filter files by fileType before adding
        if (item.fileType === fileType) {
          folderMap[item.parentId].files.push(folderMap[item.id]);
        }
      } else if (!item.documentId) {
        // Only add to root if it's a folder (no documentId)
        rootFolders.push(folderMap[item.id]);
      }
    });
  
    return rootFolders;
  };
  
  const fetchFolders = async () => {
    try {
      const data = await getFileSystem();
      const formattedFolders = formatFolderStructure(data, fileType); // Pass fileType to the formatting function
      setFolders(formattedFolders);
      
      // Set initial selected folder and its files
      if (formattedFolders.length > 0) {
        const initialFolder = formattedFolders[0];
        setSelectedFolder(initialFolder.name);
        setFiles(initialFolder.files);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFolders();
  }, [fileType]);
  

  const handleFolderSelect = (folder: FileItem) => {
    setSelectedFolder(folder.name);
    setIsDropdownOpen(false);
    setFiles(folder.files);
  };

  const handleFileClick = (id: string) => {
    const route = fileType === "pdf" ? "/pdftest/" : "/note/";
    router.push(`${route}${id}`);
  };

  return (
    <div className="w-[529px] h-[431px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl  font-semibold text-green-700">Subject</h2>
        <div className="flex gap-12">
          <Button className="px-4 py-2 bg-[#38A169] text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors">
            New Upload
          </Button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 bg-white border border-gray-200 text-black rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Image src={subjects} className="h-4 w-4" alt={""} />
              <span className="text-sm ">{selectedFolder || "Select Folder"}</span>
              {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {loading ? (
                  <div className="px-4 py-2 text-sm">Loading...</div>
                ) : (
                  folders.map((folder) => (
                    <button
                      key={folder.id}
                      className="block w-full text-left px-4 py-2 text-black text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => handleFolderSelect(folder)}
                    >
                      {folder.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 bg-[#F6F7F9] p-6 rounded-lg w-[529px] h-[430px] overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleFileClick(file.id || "")}
          >

            <Image
              src={file.fileType === "pdf" ? PdfFile : FileNote}
              alt={file.fileType === "pdf" ? "PDF" : "Note"}
              className="w-[102px] h-[128px]"
            />
            <div className="pb-4 pt-2">
              <p className="text-xs font-medium text-gray-900 truncate">
                {file.name || "Untitled"}
              </p>
              <p className="text-xs text-gray-500">{file.uploadTime} </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectsFiles;