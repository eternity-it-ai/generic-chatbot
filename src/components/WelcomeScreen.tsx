
import FileUpload from "./FileUpload";
import { ETERNITY_LOGO_URL } from "@/constants/branding";

interface WelcomeScreenProps {
  onFileSelect: (file: File) => void;
  welcomeName?: string;
}

export default function WelcomeScreen({
  onFileSelect,
  welcomeName,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={ETERNITY_LOGO_URL}
              alt="Eternity Logo"
              className="h-16 w-auto"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {welcomeName
              ? `Hello ${welcomeName}`
              : "Welcome to Eternity Strategy Portal"}
          </h2>
          <p className="text-gray-600">
            Upload your CSV file to start analyzing your data
          </p>
        </div>

        <FileUpload onFileSelect={onFileSelect} acceptedFile=".csv" />
      </div>
    </div>
  );
}
