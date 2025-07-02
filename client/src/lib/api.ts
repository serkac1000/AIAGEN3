import { apiRequest } from "./queryClient";
import type { GenerateAiaRequest } from "@shared/schema";

export const aiaApi = {
  validateConfig: async (data: GenerateAiaRequest) => {
    const response = await apiRequest("POST", "/api/validate", data);
    return response.json();
  },

  generateAia: async (data: GenerateAiaRequest, files: File[] = []) => {
    const formData = new FormData();
    
    // Append form fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'extensions') {
        formData.append(key, String(value));
      }
    });
    
    // Append files
    files.forEach(file => {
      formData.append('extensions', file);
    });

    const response = await fetch("/api/generate-aia", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Generation failed');
    }

    return response;
  },

  getUserProjects: async (userId: string) => {
    const response = await apiRequest("GET", `/api/projects/${userId}`);
    return response.json();
  },
};
