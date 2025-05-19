# SS' Rubik's Cube Solver

A sleek, cross-device web app to track, analyze, and sync your Rubik's Cube solves with ease.

## Features
- 2D cube net visualization
- Timer with spacebar and button controls
- Random scramble generator
- Solve history with sorting (newest, oldest, fastest, slowest)
- Statistics: Total Solves, All Time Personal Best, Average of Last 5, Average of Last 10, All-time Average
- Delete individual solves and all solves (with Firebase sync)
- Backup and restore solves to/from JSON
- Firebase Authentication (username-as-email, no real email required)
- Cross-device sync with Firestore
- Responsive, accessible, and mobile-friendly UI
- Roboto font and deep violet/blue color palette

## Tech Stack
- HTML, CSS (Tailwind), JavaScript
- Firebase (Auth, Firestore)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/rubiks-cube-solver.git
cd rubiks-cube-solver
```

### 2. Install Dependencies
No build step is required. Just ensure you have an internet connection for CDN dependencies (Tailwind, Firebase, etc.).

### 3. Firebase Setup
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- Enable Authentication (Email/Password) and Firestore Database.
- Replace the `firebaseConfig` in `index.html` with your own Firebase project config.

### 4. Run Locally
Just open `index.html` in your browser:
```bash
# On Windows
tart index.html
# On Mac
open index.html
# Or just double-click the file
```

## Usage
- Sign up or log in with a username and password (no real email needed).
- Track your solves, view stats, and sync across devices.
- Use the "Backup Data" and "Restore Data" buttons to export/import your solves.
- Use the "Delete All Data" button to clear all solves (from Firebase if logged in, or local storage if not).

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
[MIT](LICENSE)

---

**Made with ❤️ for cubers by Swetha Srinivasan** 