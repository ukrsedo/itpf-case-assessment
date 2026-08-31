(() => {
  const REQUIRED_ASSESSMENTS = 11;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
      const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      const submitUrl = window.PORTAL_CONFIG?.submitAssessmentUrl;
      const resultsUrl = window.PORTAL_CONFIG?.getStudentResultsUrl;

      if (!requestUrl || (requestUrl !== submitUrl && requestUrl !== resultsUrl)) {
        return response;
      }

      const clone = response.clone();
      const text = await clone.text();
      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return response;
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return response;
      }

      const completedRaw = Number(data.CompletedAssessments ?? data.completedAssessments);
      const completed = Number.isFinite(completedRaw) ? completedRaw : null;

      data.RequiredAssessments = REQUIRED_ASSESSMENTS;
      data.requiredAssessments = REQUIRED_ASSESSMENTS;

      if (completed !== null) {
        const remaining = Math.max(REQUIRED_ASSESSMENTS - completed, 0);
        data.AssessmentsRemaining = remaining;
        data.assessmentsRemaining = remaining;
      }

      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch {
      return response;
    }
  };
})();