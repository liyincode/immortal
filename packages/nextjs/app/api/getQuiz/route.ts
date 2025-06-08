import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// 通用重试工具
async function retryAsync(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  throw lastError;
}

export async function GET() {
  // 构造 prompt
  const prompt = `请你作为一名生活领域的沙雕专家，出一道动漫，游戏相关的沙雕选择题，这些问题可能是动漫或者游戏中玩家很少关注到的点，题目内容要有趣、脑洞大开且答案意想不到，题目不要太长，最好一句话。请严格按照如下 JSON 格式返回：\n{\n  "question": "题目内容",\n  "options": ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"],\n  "answer": "正确答案的字母(A/B/C/D)"\n}`;

  // 调用 OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: apiKey });

  let completion;
  try {
    completion = await retryAsync(
      () =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 512,
        }),
      3,
      1000,
    );
  } catch {
    return NextResponse.json({ error: "OpenAI API request failed" }, { status: 500 });
  }

  let quiz;
  try {
    // 尝试解析 AI 返回的 JSON
    quiz = JSON.parse(completion.choices[0].message.content ?? "{}");
  } catch {
    return NextResponse.json({ error: "Failed to parse OpenAI response" }, { status: 500 });
  }

  // 用 OpenAI TTS 生成语音
  let audioBase64 = null;
  try {
    if (quiz && quiz.question && Array.isArray(quiz.options)) {
      const mp3 = await retryAsync(
        () =>
          openai.audio.speech.create({
            model: "tts-1", // 可选 tts-1-hd
            voice: "ash", // 可选 coral, nova, alloy, shimmer, echo, fable
            input: quiz.question + " " + quiz.options.join(" "),
            instructions:
              "使用Santa 风格的语音朗读内容，语气要夸张，情绪要饱满，语气要浮夸，时不时加点'哇哦'、'本大爷'、'你绝对想不到'等词。",
          }),
        3,
        1000,
      );
      if (mp3) {
        const arrayBuffer = await mp3.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        audioBase64 = buffer.toString("base64");
      }
    }
  } catch {
    audioBase64 = null;
  }

  return NextResponse.json({ ...quiz, audio: audioBase64 ?? "" });
}
