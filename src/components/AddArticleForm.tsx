import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Sparkles } from "lucide-react";
import { algoliasearch } from "algoliasearch";

const SPACE_ID = "287485174451692";
const PERSONAL_ACCESS_TOKEN = "zs2SQLC7MKTxMk9XTmUTLgtt-95922364756537-5MzkEXF6dwGJdqDQKUuR";
const BASE_URL = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/stories`;
const UPLOAD_INIT_URL = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/assets`;

// Algolia config
const ALGOLIA_APP_ID = "UL02APK4BP";
const ALGOLIA_API_KEY = "ccd468e3fa465937fa03f6e904763e7b";
const INDEX_NAME = "knowledge_articles";

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function AddArticleForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [storyType, setStoryType] = useState<"KnowledgeArticle" | "MentalHealthArticle">("KnowledgeArticle");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [hotline, setHotline] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  async function handleAIGenerate() {
    if (!storyType) {
      toast({
        title: "Select Article Type",
        description: "Please select an article type first.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Fetch existing article titles
      const response = await fetch(
        `https://api.storyblok.com/v2/cdn/stories?version=published&filter_query[component][in]=KnowledgeArticle,MentalHealthArticle&per_page=100&token=Zx6SCt1wQ0wSxyycOBmrMwtt`
      );
      const data = await response.json();
      const existingTitles = data.stories?.map((s: any) => s.name) || [];

      let prompt = "";
      if (storyType === "KnowledgeArticle") {
        prompt = `Generate a unique Knowledge Article about general knowledge topics such as artificial intelligence, technology, science, history, current events, interesting facts, or educational content. DO NOT make it about mental health.

Requirements:
1. A compelling title
2. Content with 3-4 well-structured paragraphs (each paragraph should be 3-5 sentences)
3. 3-5 relevant tags (comma-separated)

IMPORTANT: Avoid these existing titles:
${existingTitles.join(", ")}

Return ONLY a JSON object in this exact format:
{
  "title": "Article Title Here",
  "content": "First paragraph here.\\n\\nSecond paragraph here.\\n\\nThird paragraph here.\\n\\nFourth paragraph here.",
  "tags": "tag1, tag2, tag3"
}`;
      } else {
        prompt = `Generate a unique Mental Health Article about mental health topics such as anxiety, depression, therapy, coping strategies, mindfulness, emotional wellbeing, stress management, or mental health awareness. MUST be specifically about mental health.

Requirements:
1. A compelling title
2. Content with 3-4 well-structured paragraphs (each paragraph should be 3-5 sentences)
3. 3-5 relevant tags (comma-separated)

IMPORTANT: Avoid these existing titles:
${existingTitles.join(", ")}

Return ONLY a JSON object in this exact format:
{
  "title": "Article Title Here",
  "content": "First paragraph here.\\n\\nSecond paragraph here.\\n\\nThird paragraph here.\\n\\nFourth paragraph here.",
  "tags": "tag1, tag2, tag3"
}`;
      }

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=AIzaSyDDpj4zoKVHaopDiFroi-zyxiwwD1R5Srg`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Parse JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      setTitle(parsed.title || "");
      setContent(parsed.content || "");
      setTags(parsed.tags || "");

      toast({
        title: "Success",
        description: "Article content generated successfully!",
      });
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function uploadImage(file: File): Promise<{ id: string; url: string }> {
    // Step 1: Initialize asset upload
    const initRes = await fetch(UPLOAD_INIT_URL, {
      method: "POST",
      headers: {
        Authorization: PERSONAL_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
      }),
    });
    const initData = await initRes.json();
    if (!initRes.ok) throw new Error(JSON.stringify(initData));

    const { fields, post_url } = initData;
    
    // Step 2: Upload file to S3 signed URL
    const formData = new FormData();
    Object.keys(fields).forEach((key) => formData.append(key, fields[key]));
    formData.append("file", file);

    const s3Res = await fetch(post_url, {
      method: "POST",
      body: formData,
    });

    if (!s3Res.ok) throw new Error("S3 upload failed");

    // Step 3: Fetch the uploaded asset from Storyblok to get its ID
    const searchRes = await fetch(
      `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/assets?filter_query[filename][like]=${encodeURIComponent(file.name)}`,
      {
        headers: { Authorization: PERSONAL_ACCESS_TOKEN },
      }
    );
    const searchData = await searchRes.json();
    if (!searchRes.ok || !searchData.assets || searchData.assets.length === 0) {
      throw new Error("Uploaded asset not found");
    }

    const asset = searchData.assets[0];
    return { id: asset.id.toString(), url: asset.filename };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const finalSlug = slugify(title);
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      // Step 1: Create story without image first
      let contentObj: any = {};
      if (storyType === "KnowledgeArticle") {
        contentObj = {
          component: "KnowledgeArticle",
          article: [
            {
              component: "KnowledgeBlock",
              title: title,
              content: content,
            },
          ],
          tags: tagsArray,
        };
      } else {
        contentObj = {
          component: "MentalHealthArticle",
          script: [
            {
              component: "MentalHealthScript",
              title: title,
              content: content,
              hotline: hotline || "",
            },
          ],
          tags: tagsArray,
        };
      }

      const storyPayload = {
        story: {
          name: title,
          slug: finalSlug,
          content: contentObj,
        },
        publish: true,
      };

      const createRes = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          Authorization: PERSONAL_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(storyPayload),
      });

      const createData = await createRes.json();
      if (createRes.status !== 201) {
        throw new Error(JSON.stringify(createData));
      }

      const storyId = createData.story.id;
      let finalContent = createData.story.content;

      // Step 2: If there's an image, upload it and update the story
      if (file) {
        const uploadResult = await uploadImage(file);
        
        // Step 3: Update the story to attach the image
        const updatedContent = { ...createData.story.content };

        if (storyType === "KnowledgeArticle") {
          updatedContent.article[0].image = {
            id: parseInt(uploadResult.id),
            filename: uploadResult.url,
            alt: title,
            title: title,
          };
        } else {
          updatedContent.script[0].image = {
            id: parseInt(uploadResult.id),
            filename: uploadResult.url,
            alt: title,
            title: title,
          };
        }

        const updateRes = await fetch(`${BASE_URL}/${storyId}`, {
          method: "PUT",
          headers: {
            Authorization: PERSONAL_ACCESS_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            story: { content: updatedContent },
            publish: true,
          }),
        });

        if (!updateRes.ok) {
          const updateData = await updateRes.json();
          throw new Error(JSON.stringify(updateData));
        }

        finalContent = updatedContent;
      }

      // Step 4: Update Algolia index
      try {
        // Concatenate text content
        const textBlocks =
          storyType === "KnowledgeArticle"
            ? finalContent.article.map((b: any) => b.content).join(" ")
            : finalContent.script.map((b: any) => b.content).join(" ");

        // Collect first image URL
        const imageUrls: string[] = [];
        if (storyType === "KnowledgeArticle") {
          finalContent.article.forEach((b: any) => {
            if (b.image?.filename) imageUrls.push(b.image.filename);
          });
        } else {
          finalContent.script.forEach((b: any) => {
            if (b.image?.filename) imageUrls.push(b.image.filename);
          });
        }
        const image_url = imageUrls.length ? imageUrls[0] : null;

        // Create excerpt
        const excerpt =
          textBlocks.length > 250 ? textBlocks.slice(0, 250) + "..." : textBlocks;

        // Build Algolia record
        const record: any = {
          objectID: storyId.toString(),
          title: createData.story.name,
          content: textBlocks,
          tags: finalContent.tags || [],
          type: storyType,
          slug: createData.story.slug,
          excerpt,
        };
        if (image_url) record.image_url = image_url;

        // Save to Algolia
        await algoliaClient.saveObject({
          indexName: INDEX_NAME,
          body: record,
        });
        console.log(`✅ Algolia updated for story: ${createData.story.name}`);
      } catch (err) {
        console.error("❌ Failed to update Algolia:", err);
        // Don't fail the whole operation if Algolia fails
      }

      toast({
        title: "Success",
        description: `Article "${title}" created successfully!`,
      });
      setTitle("");
      setContent("");
      setTags("");
      setHotline("");
      setFile(null);
      setOpen(false);
      
      // Reload page to show new article
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to create article: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Article
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Article</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Article Type</Label>
            <Select value={storyType} onValueChange={(v: any) => setStoryType(v)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KnowledgeArticle">Knowledge Article</SelectItem>
                <SelectItem value="MentalHealthArticle">Mental Health Article</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleAIGenerate}
              disabled={generating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {generating ? "Generating..." : "AI Generate"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter article content"
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && <Upload className="h-4 w-4 text-primary" />}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., wellness, mental health, therapy"
            />
          </div>

          {storyType === "MentalHealthArticle" && (
            <div className="space-y-2">
              <Label htmlFor="hotline">Hotline (optional)</Label>
              <Input
                id="hotline"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
                placeholder="+1-800-123-4567 or local hotline"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Article"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
