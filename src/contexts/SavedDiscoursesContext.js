import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
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

    // Load saved discourses
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
                setSavedDiscourses(savedDiscoursesData);
            } else {
                console.error("Failed to load saved discourses:", response.statusText);
            }
        } catch (error) {
            console.error("Error loading saved discourses:", error);
        } finally {
            setLoadingSaved(false);
        }
    }, [user]);

    // Load saved discourses when user changes
    useEffect(() => {
        loadSavedDiscourses();
    }, [loadSavedDiscourses]);

    // Reload saved discourses when window/tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user && user.token) {
                loadSavedDiscourses();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also reload when window gains focus
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

    // Save a discourse
    const saveDiscourse = async (discourseData, questionContext) => {
        if (!user || !user.token) {
            alert('Please log in to save discourses');
            return;
        }

        try {
            const response = await fetch(apiRoute(`saved-discourses/${user.email}`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    discourse: discourseData,
                    question_context: questionContext,
                    tags: [],
                    notes: ""
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Reload to get updated list
                await loadSavedDiscourses();
                return data;
            } else {
                console.error("Failed to save discourse:", response.statusText);
                alert('Failed to save discourse. Please try again.');
            }
        } catch (error) {
            console.error("Error saving discourse:", error);
            alert('Error saving discourse. Please try again.');
        }
    };

    // Update a saved discourse (e.g., highlights)
    const updateSavedDiscourse = async (discourseId, updates) => {
        if (!user || !user.token) return;

        try {
            const response = await fetch(apiRoute(`saved-discourses/${discourseId}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    user_email: user.email,
                    ...updates
                })
            });

            if (response.ok) {
                // Reload to get updated list
                await loadSavedDiscourses();
            } else {
                console.error("Failed to update discourse:", response.statusText);
            }
        } catch (error) {
            console.error("Error updating discourse:", error);
        }
    };

    // Unsave a discourse
    const unsaveDiscourse = async (discourseId) => {
        if (!user || !user.token) return;

        try {
            const response = await fetch(apiRoute(`saved-discourses/${discourseId}`), {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    user_email: user.email
                })
            });

            if (response.ok) {
                // Reload to get updated list
                await loadSavedDiscourses();
            } else {
                console.error("Failed to delete saved discourse:", response.statusText);
                alert('Failed to remove discourse. Please try again.');
            }
        } catch (error) {
            console.error("Error deleting saved discourse:", error);
            alert('Error removing discourse. Please try again.');
        }
    };

    // Get a specific saved discourse by title
    const getSavedDiscourseByTitle = (title) => {
        return savedDiscourses.find(saved => saved.discourse.title === title);
    };

    const value = {
        savedDiscourses,
        loadingSaved,
        loadSavedDiscourses,
        saveDiscourse,
        updateSavedDiscourse,
        unsaveDiscourse,
        getSavedDiscourseByTitle,
    };

    return (
        <SavedDiscoursesContext.Provider value={value}>
            {children}
        </SavedDiscoursesContext.Provider>
    );
};
