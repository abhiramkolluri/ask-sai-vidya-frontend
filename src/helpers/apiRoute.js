export const apiRoute = (path) =>
  `${process.env.REACT_APP_BASE_API_SERVER}/${path}`;

export const fetchBlogPost = async (slug: string) => {
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
      return {
        error: response.statusText,
      };
    }
  } catch (e) {
    throw new Error(e);
  }
};
