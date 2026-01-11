import FileUpload from "@/features/file-management/components/FileUpload";
import type { Branding } from "@/shared/types";

interface WelcomeScreenProps {
  onFileSelect: (file: File) => void;
  branding?: Branding;
  logoUrl?: string | null;
}

export default function WelcomeScreen({
  onFileSelect,
  branding,
  logoUrl,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 gap-6 items-center">
            {logoUrl && (
              <>
                <img
                  src={logoUrl}
                  alt={branding?.payload.companyName}
                  className="h-16 w-auto object-contain bg-white p-2 rounded-xl shadow-sm border border-gray-100"
                />
              </>
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {branding?.payload.welcomeName
              ? `Hello ${branding.payload.welcomeName}`
              : branding?.payload.companyName
              ? `Welcome to ${branding.payload.companyName} Strategy Portal`
              : "Welcome to Eternity Strategy Portal"}
          </h2>
          <p className="text-gray-600">
            {branding?.payload.companyName
              ? `Authorized access for ${branding.payload.companyName}. Upload your data to begin.`
              : "Upload your CSV file to start analyzing your data"}
          </p>
        </div>

        <FileUpload onFileSelect={onFileSelect} acceptedFile=".csv" />
      </div>
    </div>
  );
}
