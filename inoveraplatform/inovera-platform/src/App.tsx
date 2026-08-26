import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentDirectory from "./pages/StudentDirectory";
import Interventions from "./pages/Interventions";
import Admin from "./pages/Admin";
import Opportunities from "./pages/Opportunities";
import PartnerLayout from "./pages/PartnerLayout";
import Talent from "./pages/partner/Talent";
import Internships from "./pages/partner/Internships";
import Applications from "./pages/partner/Applications";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/directory" element={<StudentDirectory />} />
            <Route path="/interventions" element={<Interventions />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/partner" element={<PartnerLayout />}>
              <Route index element={<Talent />} />
              <Route path="internships" element={<Internships />} />
              <Route path="applications" element={<Applications />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
