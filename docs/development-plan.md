# Online Chess Development Plan

## Sprint 1: Foundation and Data Schema

**Goal:** Build a solid foundation for both frontend and backend, and establish clear communication standards.

### Project Initialization and CI/CD

- Set up Next.js (App Router), Tailwind CSS, and Radix primitives via `shadcn/ui`.
- Set up NestJS with core modules: `AuthModule`, `GameModule`, and `HistoryModule`.
- Configure linting, Prettier, and Husky to enforce code conventions.

### Database Design (Prisma + PostgreSQL)

### Frontend State Management Preparation

- Initialize a lightweight Zustand store for guest session data (`Nickname`, `GuestID`).
- Configure TanStack Query with native `fetch` to prepare API integration.

## Sprint 2: Core Chess Engine

**Epic 1: Khởi tạo Component Bàn cờ (Frontend)**

- **Tạo** `ChessBoardContainer`**:** Khởi tạo trực tiếp instance của game bên trong Component hoặc Custom Hook (VD: `const [game, setGame] = useState(new Chess());`).
- **Gắn** `react-chessboard`**:** Nhúng thư viện vào và truyền state hiện tại qua prop (VD: `position={game.fen()}`).

**Epic 2: Xử lý Tương tác & Luật chơi**

- **Logic Kéo thả (Drag & Drop):** Khi người dùng thả quân (`onPieceDrop`), gọi trực tiếp `game.move({ from, to, promotion })`.
- **Validation:** Thư viện `chess.js` sẽ tự xử lý. Nếu `game.move()` trả về `null` (nước đi sai luật), bạn chỉ cần return `false` để `react-chessboard` tự búng quân cờ về vị trí cũ (snapback).
- **Xử lý Phong cấp (Promotion):** Hiển thị UI chọn quân khi Tốt đi đến hàng cuối. Tham số `promotion` mặc định là `'q'` (Hậu) nếu người dùng đánh nhanh.
- **Kiểm tra Trạng thái Game:** Sau mỗi nước đi hợp lệ, check ngay các cờ: `game.isCheckmate()`, `game.isStalemate()`, `game.isDraw()` để trigger hiển thị Dialog kết quả.

**Epic 3: Trải nghiệm người dùng (UX) & Polish**

- **Highlight ô cờ:** Dùng hàm `game.moves({ verbose: true })` để lấy danh sách các ô có thể đi tới của một quân cờ đang được chọn, từ đó truyền prop custom style vào `react-chessboard` để hiện các chấm tròn chỉ đường.
- **Âm thanh:** Dựa vào object trả về của `game.move()` (nếu có property `captured` hoặc `san` chứa dấu `+`/`#`) để play âm thanh ăn quân, chiếu tướng, hoặc kết thúc ván tương ứng.Sprint 3: Real-time and Multiplayer

**Goal:** Bring the board online with strict state synchronization. This is the most complex sprint.

### Set Up Socket.io Gateway (NestJS)

- Configure WebSockets in `GameModule`.
- Implement room lifecycle:
  - Create Room
  - Join Room
  - Leave Room
- Manage connection mapping by `GuestID`.

### Synchronize Moves and Game State (Server-Authoritative)

- Client sends a `move_attempt` event (proposed move).
- Server validates with the `chess.js` adapter.
- If valid:
  - Update authoritative state on server
  - Broadcast `move_confirmed` event with new FEN to both clients
- Handle disconnect/reconnect with a grace period.

### Implement Timer System

- Build server-side timestamp authority and remaining-time management.
- Implement a client hook using `requestAnimationFrame` for smooth countdown rendering based on server timing data.

## Sprint 4: Data Management and MVP Polish

**Goal:** Persist results, calculate rating, and polish the overall experience.

### Complete Guest Auth and Game Entry Flow

- Home page flow:
  - Enter nickname
  - Receive JWT from `AuthModule`
  - Store token/session in Zustand and LocalStorage
- Build a waiting room UI with shareable room link copy.

### Store Match History (`HistoryModule`)

- When a game ends (checkmate/draw/resign/timeout), server automatically saves PGN and result to PostgreSQL.
- Provide REST APIs in NestJS and fetch with TanStack Query in Next.js to display played matches.

### Simple Leaderboard

- Implement basic Elo rating update logic on game completion.
- Build a leaderboard page using `shadcn/ui` Table.

