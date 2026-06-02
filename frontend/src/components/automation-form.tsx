"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  FileText,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Save,
  Sparkle,
  BookOpen,
  Info,
  Clock,
  Paperclip,
  Loader2
} from "lucide-react";
import api from "@/lib/api";

interface AutomationFormProps {
  automationId?: string; // If present, we are editing
}

export default function AutomationForm({ automationId }: AutomationFormProps) {
  const router = useRouter();

  // State variables
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [triggerType, setTriggerType] = useState("keyword");
  const [scopeType, setScopeType] = useState("all_posts");
  const [commentFilterType, setCommentFilterType] = useState("contains");
  const [messageTemplate, setMessageTemplate] = useState("");

  // Keywords
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  // Posts grid fetching
  const [availablePosts, setAvailablePosts] = useState<any[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<any[]>([]); // Items are post payloads
  const [postsLoading, setPostsLoading] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");
  const [attachType, setAttachType] = useState("link"); // link, pdf, notion, drive, playlist

  // Follow-ups
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followHours, setFollowHours] = useState("24");
  const [followMsg, setFollowMsg] = useState("");

  // UI Tabs / Steps
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // AI assist state
  const [aiGeneratingReply, setAiGeneratingReply] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("friendly");
  const [aiResourceType, setAiResourceType] = useState("playlist");

  const [aiSuggestingKeywords, setAiSuggestingKeywords] = useState(false);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const linkedAccts = await api.getAccounts();
      setAccounts(linkedAccts);

      if (linkedAccts.length > 0) {
        setSelectedAccountId(linkedAccts[0].id);
        fetchAccountPosts(linkedAccts[0].id);
      }

      if (automationId) {
        const auto = await api.getAutomation(automationId);
        setName(auto.name);
        setStatus(auto.status);
        setTriggerType(auto.trigger_type);
        setScopeType(auto.scope_type);
        setCommentFilterType(auto.comment_filter_type);
        setMessageTemplate(auto.message_template);
        setSelectedAccountId(auto.instagram_account_id);

        // Keywords
        if (auto.keywords) {
          setKeywords(auto.keywords.map((k: any) => k.keyword));
        }

        // Attachments & Follow-ups
        setAttachments(auto.attachments || []);
        setFollowUps(auto.follow_ups || []);

        // Selected Posts
        if (auto.posts) {
          setSelectedPosts(auto.posts);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load workflow dependencies.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountPosts = async (acctId: string) => {
    if (!acctId) return;
    try {
      setPostsLoading(true);
      const posts = await api.getAccountPosts(acctId);
      setAvailablePosts(posts);
    } catch (err) {
      console.error("Failed to load account media", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAccountId(val);
    fetchAccountPosts(val);
  };

  // Keyword Helpers
  const addKeyword = () => {
    const clean = keywordInput.trim().toLowerCase();
    if (clean && !keywords.includes(clean)) {
      setKeywords([...keywords, clean]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const bulkImportKeywords = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  // Post Selection Grid Helpers
  const togglePostSelection = (post: any) => {
    const exists = selectedPosts.some(p => p.media_id === post.media_id);
    if (exists) {
      setSelectedPosts(selectedPosts.filter(p => p.media_id !== post.media_id));
    } else {
      setSelectedPosts([...selectedPosts, {
        media_id: post.media_id,
        thumbnail_url: post.thumbnail_url,
        caption: post.caption,
        permalink: post.permalink,
        media_type: post.media_type,
        publish_date: post.publish_date
      }]);
    }
  };

  // Attachment Helpers
  const addAttachment = () => {
    if (!attachUrl) return;
    const name = attachName.trim() || `Resource (${attachType})`;
    setAttachments([...attachments, { name, url: attachUrl, type: attachType }]);
    setAttachName("");
    setAttachUrl("");
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Follow-up Helpers
  const addFollowUp = () => {
    if (!followMsg.trim()) return;
    setFollowUps([...followUps, { delay_hours: parseFloat(followHours), message: followMsg.trim() }]);
    setFollowMsg("");
    setFollowHours("24");
  };

  const removeFollowUp = (index: number) => {
    setFollowUps(followUps.filter((_, i) => i !== index));
  };

  // String tag inserts
  const insertVariable = (tag: string) => {
    const textarea = messageTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const nextText = text.substring(0, start) + tag + text.substring(end);
    setMessageTemplate(nextText);

    // Focus back and place cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  // AI Helpers calls
  const callAISuggestKeywords = async () => {
    if (!name) {
      setError("Please fill in the automation name to generate suggested keywords.");
      return;
    }
    setAiSuggestingKeywords(true);
    setError("");
    try {
      const suggestions = await api.suggestKeywords(name, `Trigger rule: ${triggerType}`);
      const newKeywords = [...keywords];
      suggestions.forEach(kw => {
        if (!newKeywords.includes(kw)) {
          newKeywords.push(kw);
        }
      });
      setKeywords(newKeywords);
      setSuccessMsg("AI Keywords populated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to fetch keyword recommendations.");
    } finally {
      setAiSuggestingKeywords(false);
    }
  };

  const callAIGenerateReply = async () => {
    if (!aiPrompt) {
      setError("Please describe the resource briefly to generate a message template.");
      return;
    }
    setAiGeneratingReply(true);
    setError("");
    try {
      const generated = await api.generateReply(aiPrompt, aiTone, aiResourceType);
      setMessageTemplate(generated);
      setSuccessMsg("AI reply styling applied!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to generate reply template.");
    } finally {
      setAiGeneratingReply(false);
    }
  };

  // Compile final mock message for visual preview
  const getSimulatedPreviewText = () => {
    let preview = messageTemplate || "Configure your DM template in Step 3...";
    preview = preview.replace(/{username}/g, "john_doe");
    preview = preview.replace(/{comment}/g, "python course please!");
    preview = preview.replace(/{post_name}/g, "Python playlist live! 🚀");
    preview = preview.replace(/{date}/g, new Date().toLocaleDateString([], { month: "short", day: "2-digit" }));

    if (attachments.length > 0) {
      preview += "\n\nHere are your resources:\n" + attachments.map(a => `🔗 ${a.name}: ${a.url}`).join("\n");
    }
    return preview;
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedAccountId || !messageTemplate) {
      setError("Please fill in Name, Account, and Message Template.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name,
      instagram_account_id: selectedAccountId,
      status,
      trigger_type: triggerType,
      scope_type: scopeType,
      comment_filter_type: commentFilterType,
      message_template: messageTemplate,
      keywords,
      posts: scopeType === "selected_posts" ? selectedPosts : [],
      attachments,
      follow_ups: followUps
    };

    try {
      if (automationId) {
        await api.updateAutomation(automationId, payload);
      } else {
        await api.createAutomation(payload);
      }
      router.push("/dashboard/automations");
    } catch (err: any) {
      setError(err.message || "Operation failed. Review rule settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {automationId ? "Edit Automation Workflow" : "Create Comment-to-DM Workflow"}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {automationId ? "Update trigger rules, message templates, or follow-up schedules." : "Configure new trigger actions matching comments to automated messages."}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-sm">
          {successMsg}
        </div>
      )}

      {/* Main Grid: Left Steps form, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Wizard step cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step Badges */}
          <div className="glass-panel p-3 rounded-xl border border-slate-900 flex items-center justify-between text-xs font-semibold">
            <button
              onClick={() => setActiveStep(1)}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeStep === 1 ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400"}`}
            >
              1. Basic Setup
            </button>
            <ChevronRight className="w-4 h-4 text-slate-700" />
            <button
              onClick={() => setActiveStep(2)}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeStep === 2 ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400"}`}
            >
              2. Triggers & Posts
            </button>
            <ChevronRight className="w-4 h-4 text-slate-700" />
            <button
              onClick={() => setActiveStep(3)}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeStep === 3 ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400"}`}
            >
              3. Message & AI
            </button>
            <ChevronRight className="w-4 h-4 text-slate-700" />
            <button
              onClick={() => setActiveStep(4)}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeStep === 4 ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400"}`}
            >
              4. Follow-ups
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* STEP 1: Basic setup details */}
            {activeStep === 1 && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
                <h3 className="font-bold text-base border-b border-slate-900 pb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" /> 1. Workflow Identification & Accounts
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Workflow Name (For internal dashboard sorting)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                      placeholder="e.g. Python Playlist Resource delivery"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Target Linked Instagram Account
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={handleAccountChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300"
                        required
                      >
                        {accounts.length === 0 ? (
                          <option value="">No Accounts Connected</option>
                        ) : (
                          accounts.map((acct) => (
                            <option key={acct.id} value={acct.id}>
                              @{acct.username}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Automation Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300"
                      >
                        <option value="active">Active (Deliver instantly)</option>
                        <option value="paused">Paused (Buffer incoming changes)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Triggers type & post scoping selection */}
            {activeStep === 2 && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
                <h3 className="font-bold text-base border-b border-slate-900 pb-3 flex items-center gap-2">
                  <Sparkle className="w-5 h-5 text-indigo-400" /> 2. Triggers Rules & Target Media Scopes
                </h3>

                <div className="space-y-6">
                  {/* Trigger selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Trigger Type
                      </label>
                      <select
                        value={triggerType}
                        onChange={(e) => setTriggerType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300"
                      >
                        <option value="keyword">Specific Keywords Match</option>
                        <option value="contains_any">Contains Any configured word</option>
                        <option value="ai_intent">AI Semantic Intent Detection (Typo-safe)</option>
                        <option value="all">Match All incoming comments</option>
                      </select>
                    </div>

                    {triggerType !== "all" && triggerType !== "ai_intent" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Comment Match Filter style
                        </label>
                        <select
                          value={commentFilterType}
                          onChange={(e) => setCommentFilterType(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300"
                        >
                          <option value="contains">Contains keyword phrase</option>
                          <option value="exact">Exact match only</option>
                          <option value="starts_with">Starts with keyword</option>
                          <option value="ends_with">Ends with keyword</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Keywords Input (Conditional) */}
                  {triggerType !== "all" && (
                    <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Keyword Triggers ({keywords.length})
                        </label>
                        <button
                          type="button"
                          onClick={callAISuggestKeywords}
                          disabled={aiSuggestingKeywords}
                          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          {aiSuggestingKeywords ? "Generating..." : "AI Generate Keywords"} <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={bulkImportKeywords}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          placeholder="Type keyword and press Enter or click Add..."
                        />
                        <button
                          type="button"
                          onClick={addKeyword}
                          className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {keywords.map(kw => (
                          <span
                            key={kw}
                            className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-1.5"
                          >
                            {kw}
                            <button
                              type="button"
                              onClick={() => removeKeyword(kw)}
                              className="text-slate-500 hover:text-red-400 text-xs font-black cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scopes media */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Post Scoping Limit
                      </label>
                      <select
                        value={scopeType}
                        onChange={(e) => setScopeType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300"
                      >
                        <option value="all_posts">Run across All posts & reels</option>
                        <option value="selected_posts">Run only on Selected posts</option>
                        <option value="latest_post">Run only on the latest post/reel</option>
                      </select>
                    </div>

                    {/* Media grid multi selector */}
                    {scopeType === "selected_posts" && (
                      <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Select target Media Posts ({selectedPosts.length} selected)
                        </label>

                        {postsLoading ? (
                          <div className="flex justify-center items-center py-10">
                            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : availablePosts.length === 0 ? (
                          <p className="text-xs text-slate-500">No account posts found. Connect a profile with posts.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-1.5">
                            {availablePosts.map((post) => {
                              const isSelected = selectedPosts.some(p => p.media_id === post.media_id);
                              return (
                                <div
                                  key={post.media_id}
                                  onClick={() => togglePostSelection(post)}
                                  className={`relative cursor-pointer rounded-xl overflow-hidden border aspect-square transition-all ${isSelected
                                      ? "border-cyan-500 glow-teal brightness-110"
                                      : "border-slate-800 opacity-60 hover:opacity-100"
                                    }`}
                                >
                                  <img
                                    src={post.thumbnail_url}
                                    alt="Media Thumbnail"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent p-2 flex flex-col justify-end">
                                    <p className="text-[9px] text-slate-300 line-clamp-2 leading-tight">
                                      {post.caption || "No caption"}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center font-black text-[9px] text-slate-950">
                                      ✓
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Message builder and AI styling options */}
            {activeStep === 3 && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
                <h3 className="font-bold text-base border-b border-slate-900 pb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" /> 3. Direct Message Builder & AI Styling
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Message templates edit */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        DM Message Template
                      </label>
                    </div>

                    {/* Tag insert helper row */}
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => insertVariable("{username}")}
                        className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-cyan-400 transition-all cursor-pointer"
                      >
                        + Username
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable("{comment}")}
                        className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-cyan-400 transition-all cursor-pointer"
                      >
                        + Comment
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable("{post_name}")}
                        className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-cyan-400 transition-all cursor-pointer"
                      >
                        + Post Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable("{date}")}
                        className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-cyan-400 transition-all cursor-pointer"
                      >
                        + Date
                      </button>
                    </div>

                    <textarea
                      ref={messageTextareaRef}
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      rows={8}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-sans text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                      placeholder="Hey {username}! 👋..."
                      required
                    />

                    {/* Attachments Section */}
                    <div className="pt-4 border-t border-slate-900 space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-cyan-400" /> Attached Resources ({attachments.length})
                      </h4>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={attachName}
                          onChange={(e) => setAttachName(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          placeholder="Link Display Name (e.g. PDF Guide)"
                        />
                        <input
                          type="text"
                          value={attachUrl}
                          onChange={(e) => setAttachUrl(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex gap-2 justify-between">
                        <select
                          value={attachType}
                          onChange={(e) => setAttachType(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                        >
                          <option value="link">Custom URL</option>
                          <option value="pdf">PDF File Link</option>
                          <option value="notion">Notion Workspace</option>
                          <option value="drive">Google Drive Link</option>
                          <option value="playlist">YouTube Playlist</option>
                        </select>

                        <button
                          type="button"
                          onClick={addAttachment}
                          className="px-4 py-2 rounded-lg bg-cyan-950/40 border border-cyan-950 text-cyan-400 text-xs font-bold hover:bg-cyan-950/60"
                        >
                          Attach Resource
                        </button>
                      </div>

                      <div className="space-y-2">
                        {attachments.map((att, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                            <span className="truncate max-w-[200px] font-semibold text-slate-200">🔗 {att.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="text-slate-500 hover:text-red-400 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Copywriter panel */}
                  <div className="p-4 rounded-xl border border-purple-900/30 bg-purple-950/10 space-y-4 h-fit">
                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" /> AI Message Generator
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Style engaging automated templates. Describe what resource you are sharing, pick a style, and apply.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Brief Resource Details
                        </label>
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs placeholder-slate-600"
                          placeholder="e.g. Python coding cheat sheets"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Copywriter Tone
                          </label>
                          <select
                            value={aiTone}
                            onChange={(e) => setAiTone(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                          >
                            <option value="friendly">Friendly</option>
                            <option value="professional">Professional</option>
                            <option value="exciting">Exciting</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Resource Type
                          </label>
                          <select
                            value={aiResourceType}
                            onChange={(e) => setAiResourceType(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                          >
                            <option value="playlist">Playlist Link</option>
                            <option value="pdf">PDF File</option>
                            <option value="notion">Notion page</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={callAIGenerateReply}
                        disabled={aiGeneratingReply}
                        className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all flex items-center justify-center gap-1.5"
                      >
                        {aiGeneratingReply ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                          </>
                        ) : (
                          "Generate Message template"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Follow-up Sequences */}
            {activeStep === 4 && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
                <h3 className="font-bold text-base border-b border-slate-900 pb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" /> 4. Follow-up Message Sequence
                </h3>

                <div className="space-y-6">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Set up multi-step sequences to automatically send check-in messages. (Note: delay timings are scaled for simulation purposes).
                  </p>

                  <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Check-in Message
                        </label>
                        <input
                          type="text"
                          value={followMsg}
                          onChange={(e) => setFollowMsg(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          placeholder="Hey {username}! Did you get a chance to check out the roadmap?"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Send Delay Hours
                        </label>
                        <select
                          value={followHours}
                          onChange={(e) => setFollowHours(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                        >
                          <option value="1">1 Hour</option>
                          <option value="24">24 Hours</option>
                          <option value="72">3 Days</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addFollowUp}
                      className="px-4 py-2.5 rounded-lg bg-cyan-950/40 border border-cyan-950 text-cyan-400 text-xs font-bold hover:bg-cyan-950/60 transition-all cursor-pointer"
                    >
                      Append Follow-up
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Sequence Roadmap ({followUps.length} follow-ups configured)
                    </label>

                    {followUps.length === 0 ? (
                      <p className="text-xs text-slate-500">No follow-up sequences. Delivers comment response only.</p>
                    ) : (
                      <div className="space-y-3">
                        {followUps.map((f, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 flex justify-between items-start gap-4 text-xs">
                            <div className="flex gap-3">
                              <span className="font-extrabold text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-950">
                                Step {idx + 1}
                              </span>
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block">DELAY: {f.delay_hours} hrs</span>
                                <p className="text-slate-300 mt-1">"{f.message}"</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFollowUp(idx)}
                              className="text-slate-500 hover:text-red-400 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/30 text-xs font-bold text-slate-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 inline-block mr-1" /> Previous Step
              </button>

              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-slate-950 stroke-[3]" /> Save Workflow
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Right Side: Visual Instagram DM Mockup Previewer */}
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded-xl border border-slate-900">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Visual Mockup Preview</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Instagram smartphone chat UI sandbox.</p>

            {/* Instagram Smartphone shell */}
            <div className="border border-slate-800 bg-slate-950 rounded-[30px] p-3 overflow-hidden shadow-2xl relative">
              {/* Phone Speaker & Camera notches */}
              <div className="flex justify-center w-full mb-3">
                <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-around px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                  <span className="w-8 h-1 bg-slate-800 rounded-full"></span>
                </div>
              </div>

              {/* Instagram App Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-[10px] text-cyan-400">
                    IF
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[10px] text-slate-200">InstaFlow Auto DM</h5>
                    <span className="text-[8px] text-emerald-400 font-semibold block leading-none">Active now</span>
                  </div>
                </div>
              </div>

              {/* Chat Inbox window */}
              <div className="space-y-4 min-h-[300px] flex flex-col justify-end p-2 text-xs">
                {/* Incoming bubble (from commenter) */}
                {keywords.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-[18px] px-3.5 py-2 max-w-[200px] leading-relaxed">
                      "{keywords[0]}"
                    </div>
                  </div>
                )}

                {/* Sent bubble (outgoing) */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white rounded-[18px] px-3.5 py-2 max-w-[200px] whitespace-pre-wrap leading-relaxed shadow-lg shadow-cyan-950/20 text-[10px]">
                    {getSimulatedPreviewText()}
                  </div>
                </div>
              </div>

              {/* Chat Input panel */}
              <div className="mt-4 p-2 bg-slate-900/50 rounded-full border border-slate-900 flex justify-between items-center text-[10px] text-slate-500 px-3.5">
                <span>Message...</span>
                <span className="text-cyan-400 font-bold">Send</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
