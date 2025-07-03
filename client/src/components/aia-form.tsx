import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateAiaRequestSchema, type GenerateAiaRequest } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { Cog, Key, Edit, Puzzle, Settings, Eye, EyeOff, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUpload } from "./file-upload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AiaFormProps {
  onStatusMessage: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  onClearStatus: () => void;
}

interface FeatureBadgeProps {
  name: string;
  icon: React.ReactNode;
  color: string;
}

function FeatureBadge({ name, icon, color }: FeatureBadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon}
      <span className="ml-1">{name}</span>
    </span>
  );
}

export function AiaForm({ onStatusMessage, onClearStatus }: AiaFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [designImages, setDesignImages] = useState<File[]>([]);
  const [detectedFeatures, setDetectedFeatures] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<GenerateAiaRequest>({
    resolver: zodResolver(generateAiaRequestSchema),
    defaultValues: {
      projectName: "",
      userId: "",
      apiKey: "",
      cseId: "",
      searchPrompt: "",
      requirements: "",
      extensions: [],
      saveConfig: false,
      validateStrict: true,
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (data: GenerateAiaRequest) => {
      const response = await apiRequest("POST", "/api/validate", data);
      return response.json();
    },
    onSuccess: (data) => {
      onClearStatus();
      onStatusMessage("✓ All required fields are filled", "success");
      onStatusMessage("✓ Project name format is valid", "success");
      onStatusMessage("✓ API configuration appears correct", "success");

      if (uploadedFiles.length > 0) {
        onStatusMessage(`✓ ${uploadedFiles.length} extension file(s) ready`, "success");
      }

      if (data.detectedFeatures) {
        const features = [];
        if (data.detectedFeatures.use_list_view) features.push("List View");
        if (data.detectedFeatures.play_sound) features.push("Sound Playback");
        setDetectedFeatures(features);
      }

      onStatusMessage("Configuration validation completed successfully!", "success");
      toast({
        title: "Validation Successful",
        description: "Your configuration is valid and ready for AIA generation.",
      });
    },
    onError: (error: any) => {
      onClearStatus();
      const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred";
      onStatusMessage(`Validation failed: ${errorMessage}`, "error");
      console.error("Validation error details:", error.response?.data || error);
      toast({
        title: "Validation Failed",
        description: "Please check your configuration and try again.",
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateAiaRequest) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'extensions') {
          formData.append(key, String(value));
        }
      });
      uploadedFiles.forEach(file => {
        formData.append('extensions', file);
      });
      designImages.forEach(file => {
        formData.append('designImages', file);
      });

      const response = await fetch("/api/generate-aia", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Generation failed');
        } else {
          const errorText = await response.text();
          throw new Error(errorText || 'Generation failed');
        }
      }

      return response;
    },
    onMutate: () => {
      onClearStatus();
      onStatusMessage("Starting AIA file generation...", "info");
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.getValues('projectName')}.aia`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onStatusMessage("AIA file generated successfully! Download started.", "success");
      toast({
        title: "Generation Successful",
        description: "Your AIA file has been generated and download started.",
      });
    },
    onError: (error: any) => {
      onClearStatus();
      const errorMessage = error.message || "An unknown error occurred during generation";
      onStatusMessage(`Generation failed: ${errorMessage}`, "error");
      console.error("Generation error details:", error);
      toast({
        title: "Generation Failed",
        description: "Please check the console for more details.",
        variant: "destructive",
      });
    },
  });

  // Watch requirements field to detect features
  const requirements = form.watch("requirements");

  useEffect(() => {
    if (requirements) {
      const req = requirements.toLowerCase();
      const features = [];

      if (req.includes('list view') || req.includes('show results in list')) {
        features.push('List View');
      }
      if (req.includes('play sound') || req.includes('sound')) {
        features.push('Sound Playback');
      }
      if (req.includes('custom styling') || req.includes('theme')) {
        features.push('Custom Styling');
      }
      if (req.includes('gui via image') || req.includes('image') || req.includes('picture')) {
        features.push('Image Components');
      }

      setDetectedFeatures(features);
    } else {
      setDetectedFeatures([]);
    }
  }, [requirements]);

  const onSubmit = async (data: GenerateAiaRequest) => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Validation Failed",
        description: "Please check the form for errors before generating.",
        variant: "destructive",
      });
      return;
    }

    // Ensure boolean fields are properly typed and handle empty searchPrompt
    const formattedData = {
      ...data,
      searchPrompt: data.searchPrompt || "",
      saveConfig: Boolean(data.saveConfig),
      validateStrict: Boolean(data.validateStrict)
    };
    generateMutation.mutate(formattedData);
  };

  const handleValidate = () => {
    const data = form.getValues();
    // Ensure boolean fields are properly typed and handle empty searchPrompt
    const formattedData = {
      ...data,
      searchPrompt: data.searchPrompt || "",
      saveConfig: Boolean(data.saveConfig),
      validateStrict: Boolean(data.validateStrict)
    };
    validateMutation.mutate(formattedData);
  };

  // Configuration management functions
  const saveConfiguration = useCallback(() => {
    try {
      const currentValues = form.getValues();
      const config = {
        googleApiKey: currentValues.apiKey || "",
        customSearchEngineId: currentValues.cseId || "",
        userId: currentValues.userId || "",
        searchPrompt: currentValues.searchPrompt || "",
        requirements: currentValues.requirements || "",
        projectName: currentValues.projectName || "",
        saveConfig: currentValues.saveConfig || false,
        validateStrict: currentValues.validateStrict || true,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem("aia-generator-config", JSON.stringify(config));
      onStatusMessage("Configuration saved successfully!", "success");
      toast({
        title: "Configuration Saved",
        description: "Your settings have been saved and will persist between sessions.",
      });
    } catch (error) {
      console.error("Save configuration error:", error);
      onStatusMessage("Failed to save configuration", "error");
      toast({
        title: "Save Failed",
        description: "Could not save configuration to browser storage.",
        variant: "destructive",
      });
    }
  }, [form, onStatusMessage, toast]);

  const loadConfiguration = useCallback(() => {
    try {
      const saved = localStorage.getItem("aia-generator-config");
      if (saved) {
        const config = JSON.parse(saved);

        // Load all saved values
        if (config.googleApiKey) form.setValue("apiKey", config.googleApiKey);
        if (config.customSearchEngineId) form.setValue("cseId", config.customSearchEngineId);
        if (config.userId) form.setValue("userId", config.userId);
        if (config.searchPrompt) form.setValue("searchPrompt", config.searchPrompt);
        if (config.requirements) form.setValue("requirements", config.requirements);
        if (config.projectName) form.setValue("projectName", config.projectName);
        if (config.saveConfig !== undefined) form.setValue("saveConfig", config.saveConfig);
        if (config.validateStrict !== undefined) form.setValue("validateStrict", config.validateStrict);

        onStatusMessage(`Configuration loaded from ${new Date(config.savedAt).toLocaleDateString()}`, "success");
        return true;
      }
    } catch (error) {
      console.error("Load configuration error:", error);
      onStatusMessage("Failed to load saved configuration", "warning");
    }
    return false;
  }, [form, onStatusMessage]);

  // Auto-load configuration on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConfiguration();
    }, 100); // Small delay to ensure form is ready

    return () => clearTimeout(timer);
  }, [loadConfiguration]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* Project Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Cog className="text-primary w-4 h-4" />
              </div>
              <span>Project Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="MySearchApp" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a unique name for your MIT AI2 project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="developer123" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your MIT App Inventor user identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="text-primary w-4 h-4" />
              </div>
              <span>Google Search API Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google API Key <span className="text-gray-400">(Optional)</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter your Google Custom Search API key (optional)"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Optional: Get your API key from the <a href="https://console.developers.google.com/" target="_blank" className="text-primary hover:underline">Google Cloud Console</a> for search functionality
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Search Engine ID <span className="text-gray-400">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Custom Search Engine ID (optional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional: Create and get your CSE ID from <a href="https://cse.google.com/" target="_blank" className="text-primary hover:underline">Google Custom Search</a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* App Content Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Edit className="text-primary w-4 h-4" />
              </div>
              <span>App Content & Requirements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="searchPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Search Prompt <span className="text-gray-400">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., best restaurants near me" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional: This will be the default search text in your app
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Requirements & Features</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Describe your app requirements. Examples:&#10;- Use list view to display search results&#10;- Play a sound when search completes&#10;- Add custom styling&#10;- Include specific functionality"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specify features like "list view", "play sound", etc. to customize your app
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feature Detection Preview */}
            {detectedFeatures.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="text-primary mr-2">✨</span>
                  Detected Features:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detectedFeatures.map(feature => {
                    const featureConfig = {
                      'List View': { icon: <span>📋</span>, color: 'bg-green-100 text-green-800' },
                      'Sound Playback': { icon: <span>🔊</span>, color: 'bg-blue-100 text-blue-800' },
                      'Custom Styling': { icon: <span>🎨</span>, color: 'bg-purple-100 text-purple-800' },
                    }[feature] || { icon: <span>⚡</span>, color: 'bg-gray-100 text-gray-800' };

                    return (
                      <FeatureBadge
                        key={feature}
                        name={feature}
                        icon={featureConfig.icon}
                        color={featureConfig.color}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extensions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Puzzle className="text-primary w-4 h-4" />
              </div>
              <span>Extensions (.aix files)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <Label>Extension Files (.aix)</Label>
                <FormDescription>Upload MIT App Inventor extension files</FormDescription>
                <FileUpload
                  files={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  accept=".aix"
                  multiple
                />
              </div>

              <div>
                <Label>Design Images (Optional)</Label>
                <FormDescription>Upload UI mockup or design images for reference (PNG, JPG, GIF)</FormDescription>
                <FileUpload
                  files={designImages}
                  onFilesChange={(files) => {
                    setDesignImages(files);
                    if (files.length > 0) {
                      onStatusMessage(`✓ ${files.length} design image(s) uploaded successfully`, "success");
                    }
                  }}
                  accept=".png,.jpg,.jpeg,.gif,.bmp"
                  multiple
                />
                {designImages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-green-600 font-medium">
                      ✓ {designImages.length} design image(s) uploaded - will be referenced in component generation
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {designImages.map((file, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          📷 {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
        </Card>

        {/* Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="text-primary w-4 h-4" />
              </div>
              <span>Generation Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="saveConfig"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Save configuration for future use</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validateStrict"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Strict MIT AI2 specification validation</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={validateMutation.isPending}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {validateMutation.isPending ? "Validating..." : "Validate Configuration"}
          </Button>

          <Button
            type="submit"
            disabled={generateMutation.isPending}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {generateMutation.isPending ? "Generating..." : "Generate AIA File"}
          </Button>
        </div>
      </form>
    </Form>
  );
}