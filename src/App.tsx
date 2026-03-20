import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { MyCoursesProvider } from "./context/MyCoursesContext";
import Header from "./components/Header/index";
import Hero from "./components/Hero";
import CourseCards from "./components/CourseCards";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import Profile from "./pages/Profile";
import Course from "./pages/Course";
import Workout from "./pages/Workout/index";

/** При переходе по ссылкам прокрутка остаётся со старой страницы — сбрасываем наверх. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function AppRoutes({
  onLoginClick,
  isLoginModalOpen,
  onCloseLoginModal,
}: {
  onLoginClick: () => void;
  isLoginModalOpen: boolean;
  onCloseLoginModal: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if ((location.state as { openLogin?: boolean })?.openLogin) {
      onLoginClick();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, onLoginClick]);

  return (
    <>
      <ScrollToTop />
      <Header onLoginClick={onLoginClick} />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <CourseCards onLoginClick={onLoginClick} />
              <Footer />
            </>
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/course/:courseId"
          element={<Course onLoginClick={onLoginClick} />}
        />
        <Route
          path="/course/:courseId/workout/:workoutId"
          element={<Workout />}
        />
      </Routes>
      <LoginModal isOpen={isLoginModalOpen} onClose={onCloseLoginModal} />
    </>
  );
}

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <AuthProvider>
      <MyCoursesProvider>
        <BrowserRouter>
          <AppRoutes
            onLoginClick={() => setIsLoginModalOpen(true)}
            isLoginModalOpen={isLoginModalOpen}
            onCloseLoginModal={() => setIsLoginModalOpen(false)}
          />
        </BrowserRouter>
      </MyCoursesProvider>
    </AuthProvider>
  );
}

export default App;
