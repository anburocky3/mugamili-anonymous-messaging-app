# Project Context: Anonymous Feedback & Meme App (Project Name: Mugamili)

You are an expert Frontend Architect specializing in **Next.js 16.2 (App Router)**, **Firebase 11+**, and **Tailwind CSS**.

**Project Goal:**
Build a vibrant, anonymous feedback & meme sharing platform.

1. **Rooms:** Private (PIN protected) for interns; Public for social interaction.
2. **Content:** Users can post **Text** and/or **Image/GIF URLs**.
3. **Storage Strategy:** NO file uploads. Users strictly paste direct URLs to images/GIFs.
4. **Identity:** Anonymous by default, optional Nickname.

**Tech Stack:**

- **Framework:** Next.js 16.2 (Server Actions + RSC).
- **Backend:** Firebase (Firestore ONLY - No Storage).
- **Styling:** Tailwind CSS (Vibrant, Neon, High Contrast).
- **Icons:** Lucide-React.

## 1. Data Structure (Firestore Schema)

**Collection: `messages`**

- `id`: string
- `roomId`: string (Ref)
- `nickname`: string (Default: "Anonymous [Animal]")
- `content`: string (The text feedback)
- `mediaUrl`: string (nullable, Direct URL to the image/gif)
- `timestamp`: timestamp
- `isFlagged`: boolean

## 2. Functional Rules

### A. Media Handling (URL Only)

- **Input Interface:**
  - Provide a "Link" icon button next to the chat input.
  - When clicked, show a small popover or input field: "Paste Image/GIF Link".
- **Validation:**
  - Client-side check: Ensure the URL starts with `http` or `https`.
  - Optional: Use a regex to check if it looks like an image (ends in .jpg, .png, .gif, .webp) or simply trust the `<img>` tag's `onError` to hide broken links.
- **Rendering:**
  - Render the `mediaUrl` inside a standard HTML `<img>` tag.
  - **Security:** Add `referrerPolicy="no-referrer"` to the image tag to protect user privacy (prevents sending the current page URL to the image host).
  - **Error Handling:** If the image fails to load (404 or hotlinking blocked), automatically hide the image or show a generic "Broken Image" icon.

### B. Moderation (Text)

- Run `bad-words` filter on both the `content` and the `nickname`.
- If the `mediaUrl` contains suspicious keywords (optional), flag it.

### C. Design Guidelines (Vibrant & Creative)

- **Meme Preview:** When a user pastes a URL before sending, show a small thumbnail preview above the input box so they know it works.
- **Chat Bubbles:**
  - If a message has _only_ an image: Remove the bubble background and let the image stand alone with rounded corners (`rounded-2xl border-2 border-neon-blue`).
  - If a message has text + image: Stack them neatly.

## 3. Coding Standards

- Use **Server Actions** for posting messages to Firestore.
- Use **Client Components** for the Chat Interface (Input & List) to handle real-time updates (`onSnapshot`).
- Ensure the app is **Mobile Responsive** (the input bar must not break on small screens).
