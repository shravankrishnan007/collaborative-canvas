# Application Architecture

This document details the technical decisions made for the Real-Time Collaborative Canvas.

## 1. Data Flow Diagram

The data flow is centralized through the Node.js server, which acts as the single source of truth and isolates all communication by room.
## 2. WebSocket Protocol

All events are room-based. The server identifies the client's room via their `socket.id`.

* **Client-to-Server:**
    * `join_room (room, userName)`: Sent once to join a room, set a name, and receive the room's history.
    * `drawing_event (data)`: Sent on `mousemove`/`touchmove`. Contains a single drawing *segment*.
    * `end_stroke ()`: Sent on `mouseup`/`touchend`. A marker to group segments into a "stroke" for undo.
    * `cursor_move (data)`: Sent on `mousemove`. Contains cursor position, color, and current tool.
    * `undo ()`: Sent on `Ctrl+Z` or button click.
    * `redo ()`: Sent on `Ctrl+Y` or button click.
    

* **Server-to-Client:**
    * `canvas_history (history)`: Sent *only* to the joining client. Contains the entire `actionHistory` for their room.
    * `draw_this (data)`: Broadcast to a room (`socket.to(room)`). Contains a single drawing segment.
    * `user_cursor (data)`: Broadcast to a room (`socket.to(room)`). Contains cursor ID/name, position, color, and tool.
    * `redraw_canvas (history)`: Broadcast to *all* in room (`io.in(room)`). Sent after undo/redo.
    * `user_disconnected (id)`: Broadcast to a room when a user leaves.
   

## 3. Undo/Redo & Persistence Strategy

I implemented a **hybrid event sourcing** model for undo/redo, with state saved to the filesystem.

1.  **History Storage:** The `drawing-state.js` module manages a `rooms` object, which caches the state for each room (e.g., `rooms['room-1'] = { actionHistory: [], redoStack: [] }`).
2.  **Hybrid History:** `actionHistory` is a flat array of all drawing segments, with a `{ type: 'stroke_end' }` marker pushed after every `end_stroke` event.
3.  **Undo/Redo Logic:** `undoLastStroke` pops items from `actionHistory` into `redoStack` until it finds a `stroke_end` marker. This allows for "whole stroke" undo.
4.  **Persistence:** After *any* state change (draw, undo, redo), the `saveRoomState` function is called. This function **synchronously** (`fs.writeFileSync`) saves the *entire* room state to a corresponding JSON file (e.g., `server/rooms/room-1.json`).
5.  **Loading:** When a user joins a room, `getRoomState` first checks the `rooms` cache. If not found, it checks the filesystem. `fs.readFileSync` loads the saved JSON, repopulating the state. This makes all drawings persistent.

## 4. Performance & Canvas Decisions

This project meets all "Canvas Mastery" requirements:

1.  **Layer Management:** I used a 3-layer canvas system for maximum efficiency:
    * **Layer 1 (Bottom): `drawing-canvas`** (The persistent drawing).
    * **Layer 2 (Middle): `cursor-canvas`** (Renders *remote* user cursors).
    * **Layer 3 (Top): `local-cursor-canvas`** (Renders the *local* user's eraser preview).
    This layering ensures that fast-moving cursors and previews (`requestAnimationFrame` loop) are cleared and redrawn 60x/sec *without* forcing a redraw of the entire (and much more complex) main drawing.
2.  **Efficient Redrawing Strategy:** The "state of truth" is the JSON `actionHistory`. Redrawing (for undo or new user connect) is done by clearing the canvas and re-playing this lightweight history.
3.  **Handling High-Frequency Events:** The app is built to handle `mousemove` and `touchmove` events for both drawing and cursors. All data is sent as lightweight JSON.
4.  **Path Optimization for Smooth Drawing:** This requirement conflicts with "real-time sync" (drawing segment-by-segment). My solution was to draw segment-by-segment (to be real-time) and "optimize" the visual result by setting `lineCap = 'round'` and `lineJoin = 'round'`, which makes the tiny segments connect perfectly and *appear* as one smooth, continuous line.

## 5. Conflict Resolution & Latency

* **Conflict Resolution:** This is solved by our **Global Undo** system. There are no client-side histories to conflict. The server's `actionHistory` for that *room* is the only timeline. When User A undoes User B's action, it's because "Undo" means "undo the last action on the global timeline," a robust and conflict-free strategy.
* **Handling Network Latency:**
    1.  **For the Active User:** Latency is hidden using **Client-Side Prediction**. The `drawOnCanvas_local` function draws on the screen *immediately*.
    2.  **For Passive Users:** Latency is *minimized* by sending tiny JSON packets. It is then *visually hidden* using **Interpolation**. The `cursorRenderLoop` (`requestAnimationFrame`) smoothly animates remote cursors from their last position to their new target, preventing a "janky" look. The live ping is also displayed to the user.