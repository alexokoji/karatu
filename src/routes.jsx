import { createBrowserRouter } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import App from './App';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Tutors from './pages/Tutors';
import Quiz from './pages/Quiz';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import CoursePage from './pages/CoursePage';
import CourseDetails from './pages/CourseDetails';
import NotFound from './pages/NotFound';
import VideoCall from './pages/VideoCall';
import QuizAttempt from './pages/QuizAttempt';
import Resources from './pages/Resources';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import TutorSchedule from './pages/TutorSchedule';
import TutorEarnings from './pages/TutorEarnings';
import Community from './pages/Community';
import QuizBuilder from './pages/QuizBuilder';
import FAQ from './pages/FAQ';
import TermsPrivacy from './pages/TermsPrivacy';
import Billing from './pages/Billing';
import EnrolledCourse from './pages/EnrolledCourse';
import TutorCourses from './pages/TutorCourses';
import TutorCourseLessons from './pages/TutorCourseLessons';
import TutorPrivate from './pages/TutorPrivate';
import StudentTransactions from './pages/StudentTransactions';
import StudentReceipt from './pages/StudentReceipt';
import TutorProfile from './pages/TutorProfile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'courses', element: <Courses /> },
      { path: 'tutors', element: <Tutors /> },
      { path: 'tutors/:slug', element: <TutorProfile /> },
      { path: 'admin', element: <AuthAdmin><AdminDashboard /></AuthAdmin> },
      { path: 'quiz', element: <AuthStudent><Quiz /></AuthStudent> },
      { path: 'student', element: <AuthStudent><StudentDashboard /></AuthStudent> },
      { path: 'student/transactions', element: <AuthStudent><StudentTransactions /></AuthStudent> },
      { path: 'student/transactions/:id', element: <AuthStudent><StudentReceipt /></AuthStudent> },
      { path: 'tutor', element: <AuthTutor><TutorDashboard /></AuthTutor> },
      { path: 'course', element: <AuthStudent><CoursePage /></AuthStudent> },
      { path: 'student/courses/:slug', element: <AuthStudent><EnrolledCourse /></AuthStudent> },
      { path: 'video', element: <AuthStudentOrTutor><VideoCall /></AuthStudentOrTutor> },
      { path: 'video/:sessionId', element: <AuthStudentOrTutor><VideoCall /></AuthStudentOrTutor> },
      { path: 'lessons/:id', element: <AuthStudent><Lesson /></AuthStudent> },
      { path: 'profile', element: <AuthStudent><Profile /></AuthStudent> },
      { path: 'tutor/schedule', element: <AuthTutor><TutorSchedule /></AuthTutor> },
      { path: 'tutor/courses', element: <AuthTutor><TutorCourses /></AuthTutor> },
      { path: 'tutor/courses/:slug/lessons', element: <AuthTutor><TutorCourseLessons /></AuthTutor> },
      { path: 'tutor/private', element: <AuthTutor><TutorPrivate /></AuthTutor> },
      { path: 'tutor/earnings', element: <AuthTutor><TutorEarnings /></AuthTutor> },
      { path: 'community', element: <AuthStudent><Community /></AuthStudent> },
      { path: 'quiz-builder', element: <AuthTutor><QuizBuilder /></AuthTutor> },
      { path: 'faq', element: <FAQ /> },
      { path: 'terms', element: <TermsPrivacy /> },
      { path: 'billing', element: <AuthStudent><Billing /></AuthStudent> },
      { path: 'courses/:slug', element: <CourseDetails /> },
      { path: 'quiz/:id', element: <AuthStudent><QuizAttempt /></AuthStudent> },
      { path: 'resources', element: <AuthStudent><Resources /></AuthStudent> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

function AuthStudent({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || role !== 'student') return <div className="px-6 py-10">Please log in as a student to view this page.</div>;
  return children;
}

function AuthTutor({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || role !== 'tutor') return <div className="px-6 py-10">Please log in as a tutor to view this page.</div>;
  return children;
}

function AuthAdmin({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || role !== 'admin') return <div className="px-6 py-10">Please log in as an admin to view this page.</div>;
  return children;
}

function AuthStudentOrTutor({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || (role !== 'student' && role !== 'tutor')) return <div className="px-6 py-10">Please log in as a student or tutor to view this page.</div>;
  return children;
}
