import { BACKEND_ROUTES_API } from '../../../../config/config';

export async function updateUser({
    event,
    formData,
    setIsSubmitting,
    setSaveSuccess,
    setErrors,
    setUsers,
    setFormData,
    setShowEditModal,
    setError,
    selectedUserId,   // should be set to the single selected user id from your component
  }) {
    event.preventDefault();
    setIsSubmitting(true);
    setSaveSuccess(false);
  
    // Validate form data
    const newErrors = {};
  if (!formData.username) newErrors.username = "Username is required";
  if (!formData.email) newErrors.email = "Email is required";
  
    // If there are validation errors, update state and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...newErrors,
      }));
      setIsSubmitting(false);
      return;
    }
  

  
    // Prepare data for API
    const dataToSend = {
      userId: selectedUserId,
      username: formData.username,
      email: formData.email,
  role: formData.role
    };
  
    try {
      const response = await fetch(
        BACKEND_ROUTES_API + "EditUser.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(dataToSend),
        }
      );
  
      const data = await response.json();

      if (data.success === true) {
        setSaveSuccess(true);
        setError(null); // Clear any existing errors
  

        // Update users state with the new user data

        setUsers((prev) =>
            prev.map((user) =>
              user.id === selectedUserId
                ? {
                    ...user,
                    username: formData.username,
                    email: formData.email,
                    role: formData.role,
                  }
                : user
            )
          );
          setError(null); // Clear any existing errors
          setSaveSuccess(true); // Set success message

        // Close modal
        setShowEditModal(false);
  
        // Remove success message after 5 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 5000);
      } else if (data.success === false) {
        setShowEditModal(false);
             // Close modal
             setShowEditModal(false);

  
  setError(data.message || "Failed to update user");
        setTimeout(() => {
          setError("");
        }, 5000);
       
  
        //If the error message is for an input field, set it in the errors state
        
      } else if (typeof data === "object") {
        // Handle validation errors from backend
        Object.entries(data).forEach(([field, message]) => {
          setErrors((prev) => ({
            ...prev,
            [field]: message,
          }));
        });
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
  setError("An error occurred while updating the user. Please try again.");
      console.error("Error:", error);
      setShowEditModal(false);
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
}