import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from "react";
import { apiRoute } from "../helpers/apiRoute";
import { mergeHighlightsArrays, serializeHighlightsForSave } from "../helpers/highlightUtils";
import { useAuth } from "./AuthContext";

const SavedDiscoursesContext = createContext();

export const useSavedDiscourses = () => {
    return useContext(SavedDiscoursesContext);
};

export const SavedDiscoursesProvider = ({ children }) => {
    const [savedDiscourses, setSavedDiscourses] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const { user } = useAuth();
    // Timestamp of the last local write. Mobile fires focus/visibilitychange on
    // tap, which would otherwise trigger an immediate re-fetch before Weaviate
    // has indexed the write — returning stale data and reverting the change
    // (e.g. an unsave snapping back to saved). We skip background reloads within
    // this window so the optimistic state isn't clobbered.
    const lastMutationRef = useRef(0);
    const markMutation = () => { lastMutationRef.current = Date.now(); };

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
                const RELOAD_SUPPRESS_MS = 8000;
                const fetched = savedDiscoursesData.map(mapSavedDiscourseFromApi);

                setSavedDiscourses((prev) => {
                    if (Date.now() - lastMutationRef.current < RELOAD_SUPPRESS_MS) {
                        return prev;
                    }
                    if (prev.length === 0) return fetched;

                    return fetched.map((remote) => {
                        const local = prev.find(
                            (item) =>
                                item.discourse.title === remote.discourse.title ||
                                (item.discourse.source_url &&
                                    item.discourse.source_url === remote.discourse.source_url)
                        );
                        if (!local) return remote;
                        return {
                            ...remote,
                            discourse: {
                                ...remote.discourse,
                                highlights: mergeHighlightsArrays(
                                    local.discourse.highlights,
                                    remote.discourse.highlights
                                ),
                            },
                        };
                    });
                });
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
        const RELOAD_SUPPRESS_MS = 8000;
        const recentlyMutated = () => Date.now() - lastMutationRef.current < RELOAD_SUPPRESS_MS;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user && user.token && !recentlyMutated()) {
                loadSavedDiscourses();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const handleFocus = () => {
            if (user && user.token && !recentlyMutated()) {
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

    const getDiscourseBySourceUrl = useCallback((sourceUrl) => {
        if (!sourceUrl) return null;
        return savedDiscourses.find((saved) => saved.discourse.source_url === sourceUrl);
    }, [savedDiscourses]);

    const findDiscourseForSave = useCallback((discourseData) => {
        const title = discourseData?.title || "";
        const sourceUrl = discourseData?.source_url || "";
        const matches = savedDiscourses.filter(
            (item) =>
                item.discourse.title === title ||
                (sourceUrl && item.discourse.source_url === sourceUrl)
        );
        if (matches.length === 0) return null;
        if (matches.length === 1) return matches[0];
        return [...matches].sort((a, b) => {
            const aCount = a.discourse?.highlights?.length || 0;
            const bCount = b.discourse?.highlights?.length || 0;
            if (bCount !== aCount) return bCount - aCount;
            return Date.parse(b.saved_at || 0) - Date.parse(a.saved_at || 0);
        })[0];
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

        markMutation();
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

        markMutation();
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

        markMutation();
        const title = discourseData?.title || "Untitled discourse";
        const existing = findDiscourseForSave(discourseData);

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

        markMutation();
        const title = discourseData?.title || "Untitled discourse";
        const existing = findDiscourseForSave(discourseData);
        const payload = serializeHighlightsForSave(highlightsArray);

        if (payload.length === 0) {
            if (!existing) return true;
            if (existing.bookmarked) {
                return updateSavedDiscourse(existing.id, { highlights: [] });
            }
            const deleted = await deleteDiscourseRecord(existing.id);
            return deleted ? true : null;
        }

        if (existing) {
            const result = await updateSavedDiscourse(existing.id, {
                highlights: payload,
            });
            if (result) return result;
            console.warn("Highlight update failed for existing record, creating new entry");
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
                    highlights: payload,
                })
            });

            if (response.ok) {
                const data = await response.json();
                return upsertMappedDiscourse(mapSavedDiscourseFromApi(data));
            }

            const errBody = await response.text().catch(() => "");
            console.error("Failed to save highlights:", response.status, response.statusText, errBody);
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
        getDiscourseBySourceUrl,
        findDiscourseForSave,
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
