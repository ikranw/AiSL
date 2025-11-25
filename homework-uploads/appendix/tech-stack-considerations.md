# AiSL Tech Stack Options  
*Notes on potential front-end + back-end technologies, what we’re considering, and what alternatives exist.*

## Overview
We want a tech stack that:
- is realistic for the timeline,
- works well with a 3D avatar or video rendering,
- supports LLM/text processing,
- and is easy for our team to maintain.

Below are the main options we discussed, plus alternatives we might consider if things get complicated.

---

# Front-End Options

### 1. **React (most likely choice)**
**Why it makes sense:**
- Easy to build UI quickly.
- Great for interactive applications.
- Tons of documentation and tutorials.
- Works well with APIs and LLM-based features.
- Can embed Unity WebGL builds if needed (for the avatar).

**Possible challenges:**
- Hosting Unity WebGL inside React can be tricky.
- Styling can feel repetitive unless we use a UI library.

**Add-ons we might use:**
- TailwindCSS for fast styling.
- Vite or Next.js for smoother development.

---

### 2. **Next.js**
**Pros:**
- Server-side rendering (faster loads).
- Easier API routes built-in.
- Lots of students/teams use it for modern apps.
- Easier deployment on Vercel.

**Why we might *not* choose it:**
- Added complexity if we don't need SSR.
- Unity integration is still possible but not simpler than React.

---

### 3. **Vue**
**Pros:**
- Beginner-friendly.
- Clean and lightweight.
- Has an ecosystem similar to React.

**Cons:**
- Fewer examples for Unity/3D integration.
- Team familiarity might be lower.

---

### 4. **Plain HTML/CSS/JS (not recommended but possible)**
**Pros:**
- Simple setup.
- Works for early prototypes.

**Cons:**
- Very limited for our actual demo.
- Not scalable for the full app.

---

### 5. **Unity Front-End (Full Unity App)**
**Why this is an option:**
- If our avatar ends up living inside Unity anyway, we could build the whole interface there.
- Unity can export to WebGL or desktop apps.

**Why it might not be ideal:**
- UI is way harder to build in Unity.
- Overkill unless the whole app is avatar-heavy.
- WebGL builds can be slow or large in size.

---

# Back-End Options

### 1. **Node.js + Express**
**Pros:**
- Simple and familiar for many students.
- Works well with LLM APIs (OpenAI, etc.).
- Easy to deploy.

**Cons:**
- Not ideal for heavy data processing (e.g., animatio
