"use client";

import { calculateCreditCost } from "@moneyprint/shared";
import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type CreateResponse = {
  jobId?: string;
  error?: string;
};

export function CreateVideoForm() {
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<30 | 60>(30);
  const [voiceId, setVoiceId] = useState("en-US-JennyNeural-Female");
  const [subtitleStyle, setSubtitleStyle] = useState("bold");
  const [musicStyle, setMusicStyle] = useState("none");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creditCost = useMemo(() => calculateCreditCost(durationSeconds, 1), [durationSeconds]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/videos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        prompt,
        language: "en",
        aspectRatio: "9:16",
        durationSeconds,
        voiceId,
        subtitleStyle,
        musicStyle,
        variants: 1
      })
    });
    const payload = (await response.json()) as CreateResponse;
    setIsSubmitting(false);

    if (!response.ok || !payload.jobId) {
      setMessage(payload.error || "Could not create the video job.");
      return;
    }

    window.location.href = `/videos/${payload.jobId}`;
  }

  return (
    <form className="form panel panel-pad" onSubmit={submit}>
      <div className="field">
        <label htmlFor="topic">Topic</label>
        <input
          id="topic"
          minLength={3}
          maxLength={240}
          placeholder="Example: Three money habits that compound quietly"
          required
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="prompt">Direction</label>
        <textarea
          id="prompt"
          maxLength={2000}
          placeholder="Optional tone, audience, hook, or must-include points."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </div>

      <div className="grid two">
        <div className="field">
          <label htmlFor="duration">Duration</label>
          <select
            id="duration"
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value) as 30 | 60)}
          >
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="voice">Voice</label>
          <select id="voice" value={voiceId} onChange={(event) => setVoiceId(event.target.value)}>
            <option value="en-US-JennyNeural-Female">Jenny, natural female</option>
            <option value="en-US-GuyNeural-Male">Guy, clear male</option>
            <option value="en-US-AriaNeural-Female">Aria, energetic female</option>
          </select>
        </div>
      </div>

      <div className="grid two">
        <div className="field">
          <label htmlFor="subtitles">Subtitle style</label>
          <select id="subtitles" value={subtitleStyle} onChange={(event) => setSubtitleStyle(event.target.value)}>
            <option value="bold">Bold captions</option>
            <option value="clean">Clean lower third</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="music">Music</label>
          <select id="music" value={musicStyle} onChange={(event) => setMusicStyle(event.target.value)}>
            <option value="none">No music</option>
            <option value="licensed_pack_1">Licensed pack 1</option>
          </select>
        </div>
      </div>

      <div className="notice">
        This MVP creates one English 9:16 variant and costs {creditCost} credit{creditCost === 1 ? "" : "s"}.
      </div>

      {message ? <p className="notice">{message}</p> : null}

      <button className="button primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? <Loader2 size={16} /> : <Sparkles size={16} />}
        Queue video
      </button>
    </form>
  );
}
