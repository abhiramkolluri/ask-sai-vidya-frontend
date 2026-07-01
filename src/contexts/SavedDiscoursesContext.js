import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { apiRoute } from "../helpers/apiRoute";
import { useAuth } from "./AuthContext";

const SavedDiscoursesContext = createContext();

export const useSavedDiscourses = () => {
    return useContext(SavedDiscoursesContext);
};

export const SavedDiscoursesProvider = ({ children }) => {
    const [savedDiscourses, setSavedDiscourses] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const { user } = useAuth();

    const mapSavedDiscourseFromApi = useCallback((item) => {
        const sourceCitation = item.collection_name || item.discourse?.source_citation || "";
        const highlights = item.discourse?.highlights || item.highlights || [];
        return {
            id: item.id,
            saved_at: item.saved_at,
            bookmarked: item.bookmarked === true || item.bookmarked === "true",
            question_context: item.question_context || "",
            discourse: {
                title: item.title || item.discourse?.title || "",
                content: item.content_preview || item.discourse?.content || "",
                source_url: item.link || item.discourse?.source_url || "",
                source_citation: sourceCitation,
                highlights: highlights,
            },
        };
    }, []);

    const deriveArticleUuid = (discourseData) => {
        if (discourseData?.article_uuid) {
            return discourseData.article_uuid;
        }

        const sourceUrl = discourseData?.source_url || "";
        const blogId = sourceUrl.startsWith('/blog/') ? sourceUrl.replace('/blog/', '') : "";
        if (blogId) {
            return blogId;
        }

        return discourseData?.title || `saved-${Date.now()}`;
    };

    const deriveCollectionName = (discourseData) => {
        const citation = discourseData?.source_citation || "";
        if (!citation.includes(' - ')) {
            return citation;
        }
        return citation.split(' - ').slice(1).join(' - ').trim();
    };

    const upsertMappedDiscourse = useCallback((mapped) => {
        setSavedDiscourses((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.discourse.title === mapped.discourse.title
            );
            if (existingIndex >= 0) {
                const next = [...prev];
                next[existingIndex] = mapped;
                return next;
            }
            return [mapped, ...prev];
        });
        return mapped;
    }, []);

    const loadSavedDiscourses = useCallback(async () => {
        if (!user || !user.token) {
            setSavedDiscourses([]);
            return;
        }

        try {
            setLoadingSaved(true);
            const response = await fetch(apiRoute(`saved-discourses/${user.email}`), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                const savedDiscoursesData = await response.json();
                setSavedDiscourses(savedDiscoursesData.map(mapSavedDiscourseFromApi));
            } else {
                console.error("Failed to load saved discourses:", response.statusText);
            }
        } catch (error) {
            console.error("Error loading saved discourses:", error);
        } finally {
            setLoadingSaved(false);
        }
    }, [user, mapSavedDiscourseFromApi]);

    useEffect(() => {
        loadSavedDiscourses();
    }, [loadSavedDiscourses]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user && user.token) {
                loadSavedDiscourses();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const handleFocus = () => {
            if (user && user.token) {
                loadSavedDiscourses();
            }
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [user, loadSavedDiscourses]);

    const getDiscourseByTitle = useCallback((title) => {
        return savedDiscourses.find((saved) => saved.discourse.title === title);
    }, [savedDiscourses]);

    const isDiscourseBookmarked = useCallback((title) => {
        const discourse = getDiscourseByTitle(title);
        return Boolean(discourse?.bookmarked);
    }, [getDiscourseByTitle]);

    const bookmarkedDiscourses = useMemo(
        () => savedDiscourses.filter((item) => item.bookmarked),
        [savedDiscourses]
    );

    const annotatedDiscourses = useMemo(
        () => savedDiscourses.filter((item) => item.discourse.highlights?.length > 0),
        [savedDiscourses]
    );

    const updateSavedDiscourse = async (discourseId, updates) => {
        if (!user || !user.token) return null;

        const previous = savedDiscourses;
        setSavedDiscourses((prev) =>
            prev.map((item) => {
                if (item.id !== discourseId) return item;
                return {
                    ...item,
                    bookmarked: updates.bookmarked !== undefined ? updates.bookmarked : item.bookmarked,
                    question_context: updates.question_context !== undefined
                        ? updates.question_context
                        : item.question_context,
                    discourse: {
                        ...item.discourse,
                        highlights: updates.highlights !== undefined
                            ? updates.highlights
                            : item.discourse.highlights,
                    },
                };
            })
        );

        try {
            const response = await fetch(apiRoute(`saved-discourses/${user.email}/${discourseId}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                setSavedDiscourses(previous);
                console.error("Failed to update saved discourse:", response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            const mapped = mapSavedDiscourseFromApi(data);
            upsertMappedDiscourse(mapped);
            return mapped;
        } catch (error) {
            setSavedDiscourses(previous);
            console.error("Error updating discourse:", error);
            return null;
        }
    };

    const deleteDiscourseRecord = async (discourseId) => {
        if (!user || !user.token) return false;

        const previous = savedDiscourses;
        setSavedDiscourses((prev) => prev.filter((item) => item.id !== discourseId));

        try {
            const response = await fetch(apiRoute(`saved-discourses/${user.email}/${discourseId}`), {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    user_email: user.email
                })
            });

            if (!response.ok) {
                setSavedDiscourses(previous);
                console.error("Failed to delete saved discourse:", response.statusText);
                return null;
            }
            return true;
        } catch (error) {
            setSavedDiscourses(previous);
            console.error("Error deleting discourse:", error);
            return false;
        }
    };

    const saveDiscourse = async (discourseData, questionContext) => {
        if (!user || !user.token) {
            alert('Please log in to save discourses');
            return null;
        }

        const title = discourseData?.title || "Untitled discourse";
        const existing = getDiscourseByTitle(title);

        if (existing) {
            return updateSavedDiscourse(existing.id, {
                bookmarked: true,
                question_context: questionContext || existing.question_context,
            });
        }

        try {
            const response = await fetch(apiRoute(`saved-discourses/${user.email}`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    article_uuid: deriveArticleUuid(discourseData),
                    title,
                    content_preview: discourseData?.content || "",
                    link: discourseData?.source_url || "",
                    collection_name: deriveCollectionName(discourseData),
                    question_context: questionContext || "",
                    bookmarked: true,
                    highlights: discourseData?.highlights || [],
                })
            });

            if (response.ok) {
                const data = await response.json();
                return upsertMappedDiscourse(mapSavedDiscourseFromApi(data));
            }

            console.error("Failed to save discourse:", response.statusText);
            alert('Failed to save discourse. Please try again.');
        } catch (error) {
            console.error("Error saving discourse:", error);
            alert('Error saving discourse. Please try again.');
        }

        return null;
    };

    const saveHighlights = async (discourseData, highlightsArray) => {
        if (!user || !user.token) return null;

        const title = discourseData?.title || "Untitled discourse";
        const existing = getDiscourseByTitle(title);

        if (highlightsArray.length === 0) {
            if (!existing) return true;
            if (existing.bookmarked) {
                return updateSavedDiscourse(existing.id, { highlights: [] });
            }
            const deleted = await deleteDiscourseRecord(existing.id);
            return deleted ? true : null;
        }

        if (existing) {
            return updateSavedDiscourse(existing.id, {
                highlights: highlightsArray,
            });
        }

        try {
            const response = await fetch(apiRoute(`saved-discourses/${user.email}`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    article_uuid: deriveArticleUuid(discourseData),
                    title,
                    content_preview: discourseData?.content || "",
                    link: discourseData?.source_url || "",
                    collection_name: deriveCollectionName(discourseData),
                    question_context: "",
                    bookmarked: false,
                    highlights: highlightsArray,
                })
            });

            if (response.ok) {
                const data = await response.json();
                return upsertMappedDiscourse(mapSavedDiscourseFromApi(data));
            }

            console.error("Failed to save highlights:", response.statusText);
        } catch (error) {
            console.error("Error saving highlights:", error);
        }

        return null;
    };

    const removeBookmark = async (discourseId) => {
        const discourse = savedDiscourses.find((item) => item.id === discourseId);
        if (!discourse) return false;

        const hasHighlights = discourse.discourse.highlights?.length > 0;
        if (hasHighlights) {
            const result = await updateSavedDiscourse(discourseId, { bookmarked: false });
            return Boolean(result);
        }

        return deleteDiscourseRecord(discourseId);
    };

    const clearAnnotations = async (discourseId) => {
        const discourse = savedDiscourses.find((item) => item.id === discourseId);
        if (!discourse) return false;

        if (discourse.bookmarked) {
            const result = await updateSavedDiscourse(discourseId, { highlights: [] });
            return Boolean(result);
        }

        return deleteDiscourseRecord(discourseId);
    };

    const value = {
        savedDiscourses,
        bookmarkedDiscourses,
        annotatedDiscourses,
        loadingSaved,
        loadSavedDiscourses,
        saveDiscourse,
        saveHighlights,
        updateSavedDiscourse,
        removeBookmark,
        clearAnnotations,
        deleteDiscourseRecord,
        getDiscourseByTitle,
        isDiscourseBookmarked,
        getSavedDiscourseByTitle: getDiscourseByTitle,
        unsaveDiscourse: removeBookmark,
    };

    return (
        <SavedDiscoursesContext.Provider value={value}>
            {children}
        </SavedDiscoursesContext.Provider>
    );
};
