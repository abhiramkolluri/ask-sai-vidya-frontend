export const apiRoute = (path) => {
  const baseUrl = process.env.REACT_APP_BASE_API_SERVER;
  if (!baseUrl) {
    console.error('⚠️ REACT_APP_BASE_API_SERVER is not set! API calls will fail.');
    console.error('Please set this environment variable in AWS Amplify Console or your .env file.');
    // Return a placeholder that will obviously fail, but at least the app won't crash
    return `undefined/${path}`;
  }
  return `${baseUrl}/${path}`;
};

export const fetchBlogPost = async (slug) => {
  // return fetch(apiRoute(`blog/${slug}`))
  //   .then((res) => res.json())
  //   .catch((err) => {
  //     console.log("🚀 ~ fetchBlogPost ~ err:", err);
  //     throw new Error(err);
  //   });

  try {
    const response = await fetch(apiRoute(`blog/${slug}`));
    if (response.ok) return response.json();
    else {
      throw new Error(response.statusText);
    }
  } catch (e) {
    throw new Error(e);
  }
};

export const submitFeedback = async (feedbackData) => {
  try {
    console.log('Sending feedback to backend:', feedbackData);
    const response = await fetch(apiRoute('api/feedback'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Feedback submission response:', result);
      return result;
    } else {
      throw new Error('Failed to submit feedback');
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};
