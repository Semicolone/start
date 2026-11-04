import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Home from "./pages/Home.jsx";
import SaveInsight from "./pages/SaveInsight.jsx";
import TableView from "./pages/TableView.jsx";
import CategoryManage from "./pages/CategoryManage.jsx";
import Analysis from "./pages/Analysis.jsx";
import { INITIAL_CATEGORIES } from "./data.js";

export default function App() {
  const [page, setPage] = useState("home");
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);

  return (
    <div className="shell">
      <Sidebar page={page} setPage={setPage} categories={categories} />
      <div className="main">
        <Topbar setPage={setPage} />
        <div className="content">
          {page === "home" && <Home setPage={setPage} />}
          {page === "save" && <SaveInsight />}
          {page === "table" && <TableView />}
          {page === "category" && <CategoryManage categories={categories} setCategories={setCategories} />}
          {page === "analysis" && <Analysis />}
        </div>
      </div>
    </div>
  );
}
