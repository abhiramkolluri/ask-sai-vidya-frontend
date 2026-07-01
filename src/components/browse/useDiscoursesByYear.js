import { useState, useEffect, useCallback } from "react";
import { apiRoute } from "../../helpers/apiRoute";

export function useDiscourseYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(apiRoute("discourses/years"))
      .then((r) => r.json())
      .then((data) => setYears(data.years || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { years, loading, error };
}

export function useDiscoursesByYear(year, page = 1, limit = 20) {
  const [data, setData] = useState({ discourses: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!year) return;
    setLoading(true);
    setError(null);
    fetch(apiRoute(`discourses/year/${year}?page=${page}&limit=${limit}`))
      .then((r) => r.json())
      .then((d) =>
        setData({
          discourses: d.discourses || [],
          total: d.total || 0,
          pages: d.pages || 1,
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, error };
}
