# Real-Time Collaboration Drawing Canvas

## Live Demo

**You can use the live deployed application here:**
**[https://collaborative-canvas-2ndk.onrender.com/](https://collaborative-canvas-2ndk.onrender.com/)**

This is a multi user, real time drawing application built from scratch with Node.js and vanilla JavaScript.
It features a 3-layer canvas system for efficient rendering, real time synchronization of drawing and cursors, and a robust global undo/redo system.
 ## Core Features
 
 * **Real Time Sync:** Drawings and cursors appear for all users instantly.
 * **Drawing Tools:** Brush, eraser, custom color picker (with recently choosen colors), and separate width sliders for brush as well as the eraser.
 * **User Indicators:** See other user's cursors and their names.(interpolation implemented on cursor movement to get rid of jaggy cursor movement).
 * **Global Undo/Redo:** A shared history (Ctrl+z / Ctrl+Y) allows all users to undo or redo strokes.
 * **Efficient Redrawing:** The app redraws from a lightweight JSON state model, not heavy image data.
 * **Room System:** A secure, multi-room architecture. All drawings are isolated to their specific room.
 * **Drawing Persistence:** All drawings are automatically saved to the server's file system, so they are restored even after a server restart.
 * **Performance Metrics:** A live **FPS** to monitor client and network performance.
 * **Mobile Support:** Includes full support for **touch events** (`touchstart`, `touchmove`) for drawing on mobile devices.

 ## Setup & Running
 The project is built with Node.js and has no external database dependencies.

 1. **Clone the repository:**
    ```bash
    git clone https://github.com/shravankrishnan007/collaborative-canvas.git
    cd collaborative-canvas
    ```
 2. **Install dependencies:**
    ```bash
    npm install
    ```
 3. **Run the server:**
    ```bash
    npm start
    ```
 4. **Open the app:**
    Open `http://localhost:3000` in your browser.

 ## How to Test
 1.  Open `http://localhost:3000` in a regular browser window (User A).
2.  Open `http://localhost:3000` in an **incognito** browser window (User B).
3.  **Test Rooms:**
    * Have User A join room: **`room-1`** (and enter a name).
    * Have User B join room: **`room-2`** (and enter a name).
    * Draw as User A. Nothing should appear for User B.
4.  **Test Sync & History:**
    * Have User B refresh and join **`room-1`**.
    * User B should **instantly see** User A's drawing.
    * Draw as User A. The line and cursor (with interpolation) should appear on User B's screen.
5.  **Test Persistence:**
    * Draw a circle in `room-1`.
    * **Stop** your server (`Ctrl+C` in the terminal).
    * Check your `server/rooms/` folder. A `room-1.json` file should exist.
    * **Restart** your server (`npm start`).
    * Refresh User A's browser and rejoin `room-1`. The circle should reload from the file.
## Time Spent 
* **Total Time:** 32 hours
## Known Limitations & Future Improvements
* **File Storage:** Persistence is on the local filesystem . A production app would benefit from a more scalable solution like a cloud bucket (S3) or a proper database.

