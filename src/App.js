import { useEffect, useRef, useState } from "react";
import "./App.css";

const GAME_DURATION = 30;
const TARGET_SIZE = 88;
const OWNER_EMAIL = "owner@gmail.com";
const ACCOUNTS_KEY = "reflex-arena-accounts";
const SESSION_KEY = "reflex-arena-session";

const createVelocity = (boost = 0) => {
  const speed = 2.8 + Math.random() * 1.8 + boost;
  const angle = Math.random() * Math.PI * 2;

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
};

const createBox = (arena, boost = 0) => {
  if (!arena) return null;

  const { width, height } = arena.getBoundingClientRect();
  const minPadding = TARGET_SIZE / 2 + 10;
  const maxX = Math.max(minPadding, width - minPadding);
  const maxY = Math.max(minPadding, height - minPadding);

  return {
    x: Math.random() * (maxX - minPadding) + minPadding,
    y: Math.random() * (maxY - minPadding) + minPadding,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    ...createVelocity(boost),
  };
};

const readStoredAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
};

const readStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
};

const writeStoredAccounts = (accounts) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const writeStoredSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const openOwnerNotification = ({ action, name, email }) => {
  const subject = encodeURIComponent(`Reflex Arena ${action}`);
  const body = encodeURIComponent(
    [
      `Action: ${action}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Time: ${new Date().toLocaleString()}`,
      "",
      "Password is intentionally not included.",
    ].join("\n")
  );

  window.open(`mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`, "_blank");
};

function AuthScreen({ mode, formState, onChange, onModeChange, onSubmit, errorMessage }) {
  const isSignup = mode === "signup";

  return (
    <main className="app-shell">
      <section className="auth-layout">
        <article className="auth-hero-card">
          <p className="eyebrow">Reflex Arena Access</p>
          <h1>Login or create an account before you enter the game floor.</h1>
          <p className="hero-text">
            Secure your spot, track your play session, and unlock the reflex challenge.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="feature-number">01</span>
              <div>
                <h2>Fast onboarding</h2>
                <p>Simple email and password access with a clear split between login and signup.</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="feature-number">02</span>
              <div>
                <h2>Owner alerts</h2>
                <p>Each auth event prepares a Gmail-ready notification without exposing passwords.</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="feature-number">03</span>
              <div>
                <h2>Protected game view</h2>
                <p>Players land directly inside the arena after a successful auth action.</p>
              </div>
            </div>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "login" ? "auth-tab auth-tab-active" : "auth-tab"}
              onClick={() => onModeChange("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={isSignup ? "auth-tab auth-tab-active" : "auth-tab"}
              onClick={() => onModeChange("signup")}
            >
              Sign up
            </button>
          </div>

          <div className="auth-copy">
            <p className="eyebrow">{isSignup ? "Create player account" : "Welcome back"}</p>
            <h2>{isSignup ? "Build your login" : "Enter your credentials"}</h2>
            <p className="status-text">
              {isSignup
                ? "New players can register here and move straight into the arena."
                : "Existing players can sign in and continue playing."}
            </p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            {isSignup && (
              <label className="field-group">
                <span>Name</span>
                <input
                  name="name"
                  type="text"
                  placeholder="Player name"
                  value={formState.name}
                  onChange={onChange}
                  required
                />
              </label>
            )}

            <label className="field-group">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="player@email.com"
                value={formState.email}
                onChange={onChange}
                required
              />
            </label>

            <label className="field-group">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="Enter password"
                value={formState.password}
                onChange={onChange}
                required
                minLength={6}
              />
            </label>

            {errorMessage && <p className="form-error">{errorMessage}</p>}

            <button type="submit" className="primary-button auth-submit">
              {isSignup ? "Create account" : "Login now"}
            </button>
          </form>

          <p className="auth-note">
            Owner notification email target: <strong>{OWNER_EMAIL}</strong>. Replace this value in code with the
            real Gmail address.
          </p>
        </section>
      </section>
    </main>
  );
}

function GameScreen({ user, onLogout }) {
  const arenaRef = useRef(null);
  const animationRef = useRef(null);
  const scoreRef = useRef(0);
  const [box, setBox] = useState(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    if (time <= 0) {
      setGameOver(true);
      setIsPlaying(false);
      return;
    }

    const timer = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, time]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    setBox(createBox(arenaRef.current, scoreRef.current * 0.03));
    const handleResize = () => {
      setBox(createBox(arenaRef.current, scoreRef.current * 0.03));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const animate = () => {
      const arena = arenaRef.current;
      if (!arena) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const { width, height } = arena.getBoundingClientRect();
      const halfSize = TARGET_SIZE / 2;

      setBox((currentBox) => {
        if (!currentBox) return currentBox;

        let nextX = currentBox.x + currentBox.vx;
        let nextY = currentBox.y + currentBox.vy;
        let nextVx = currentBox.vx;
        let nextVy = currentBox.vy;

        if (nextX <= halfSize || nextX >= width - halfSize) {
          nextVx *= -1;
          nextX = Math.min(Math.max(nextX, halfSize), width - halfSize);
        }

        if (nextY <= halfSize || nextY >= height - halfSize) {
          nextVy *= -1;
          nextY = Math.min(Math.max(nextY, halfSize), height - halfSize);
        }

        return {
          ...currentBox,
          x: nextX,
          y: nextY,
          vx: nextVx,
          vy: nextVy,
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (arenaRef.current) {
        setBox(createBox(arenaRef.current));
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClick = () => {
    const audio = new Audio("/click.mp3");
    audio.play().catch(() => {});
    setScore((prev) => prev + 1);
    setBox((currentBox) => {
      if (!currentBox) return currentBox;

      return {
        ...currentBox,
        color: `hsl(${Math.random() * 360}, 78%, 56%)`,
        ...createVelocity(Math.min(2.4, (scoreRef.current + 1) * 0.04)),
      };
    });
  };

  const startGame = () => {
    setScore(0);
    setTime(GAME_DURATION);
    setGameOver(false);
    setIsPlaying(true);
  };

  const accuracy = Math.round((score / GAME_DURATION) * 10) / 10;
  const urgencyClass =
    time <= 5 && isPlaying ? "hud-card hud-card-alert" : "hud-card";

  const statusLabel = gameOver
    ? "Round finished"
    : isPlaying
    ? "Target live"
    : "Ready to start";

  const statusText = gameOver
    ? `Final score ${score}`
    : isPlaying
    ? "Tap the prism before it shifts again."
    : "Start the round and chase the moving prism.";

  return (
    <main className="app-shell">
      <section className="game-panel">
        <div className="top-strip">
          <div>
            <p className="eyebrow">Player session</p>
            <p className="player-line">
              {user.name} <span>{user.email}</span>
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">Reflex Arena</p>
          <h1>Hit the moving prism before the clock drains out.</h1>
          <p className="hero-text">
            One target. Thirty seconds. Clean reactions win.
          </p>
        </div>

        <div className="hud-grid">
          <article className="hud-card">
            <span className="hud-label">Score</span>
            <strong className="hud-value">{score}</strong>
          </article>
          <article className={urgencyClass}>
            <span className="hud-label">Time</span>
            <strong className="hud-value">{time}s</strong>
          </article>
          <article className="hud-card">
            <span className="hud-label">Pace</span>
            <strong className="hud-value">{accuracy}/s</strong>
          </article>
        </div>

        <section className="arena-frame">
          <div className="status-bar">
            <div>
              <p className="status-label">{statusLabel}</p>
              <p className="status-text">{statusText}</p>
            </div>
            <button className="primary-button" onClick={startGame}>
              {gameOver ? "Play again" : isPlaying ? "Restart" : "Start game"}
            </button>
          </div>

          <div className="arena" ref={arenaRef}>
            {!isPlaying && (
              <div className="overlay-card">
                <p className="overlay-kicker">
                  {gameOver ? "Round complete" : `Welcome ${user.name}`}
                </p>
                <h2>{gameOver ? `You scored ${score}` : "Ready for a fast round?"}</h2>
                <p>
                  {gameOver
                    ? "Run it again and try to hold a stronger pace through the final seconds."
                    : "Press start, then click the bouncing prism each time it cuts across the arena."}
                </p>
              </div>
            )}

            {isPlaying && box && (
              <button
                type="button"
                className="box"
                aria-label="Click target"
                onClick={handleClick}
                style={{
                  top: `${box.y}px`,
                  left: `${box.x}px`,
                  background: `radial-gradient(circle at 30% 30%, #fff7d6 0%, ${box.color} 40%, #0c1220 100%)`,
                }}
              />
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const session = readStoredSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = (nextMode = authMode) => {
    setAuthMode(nextMode);
    setFormState({
      name: "",
      email: "",
      password: "",
    });
    setErrorMessage("");
  };

  const handleModeChange = (mode) => {
    resetForm(mode);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = formState.email.trim().toLowerCase();
    const trimmedName = formState.name.trim();
    const password = formState.password;
    const accounts = readStoredAccounts();

    if (authMode === "signup") {
      const existingAccount = accounts.find((account) => account.email === normalizedEmail);
      if (existingAccount) {
        setErrorMessage("An account with this email already exists.");
        return;
      }

      const newAccount = {
        name: trimmedName,
        email: normalizedEmail,
        password,
      };

      const nextAccounts = [...accounts, newAccount];
      writeStoredAccounts(nextAccounts);
      writeStoredSession({ name: newAccount.name, email: newAccount.email });
      setCurrentUser({ name: newAccount.name, email: newAccount.email });
      openOwnerNotification({
        action: "signup",
        name: newAccount.name,
        email: newAccount.email,
      });
      resetForm("login");
      return;
    }

    const matchedAccount = accounts.find(
      (account) => account.email === normalizedEmail && account.password === password
    );

    if (!matchedAccount) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    writeStoredSession({
      name: matchedAccount.name,
      email: matchedAccount.email,
    });
    setCurrentUser({
      name: matchedAccount.name,
      email: matchedAccount.email,
    });
    openOwnerNotification({
      action: "login",
      name: matchedAccount.name,
      email: matchedAccount.email,
    });
    resetForm("login");
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    resetForm("login");
  };

  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode}
        formState={formState}
        onChange={handleChange}
        onModeChange={handleModeChange}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
      />
    );
  }

  return <GameScreen user={currentUser} onLogout={handleLogout} />;
}

export default App;
