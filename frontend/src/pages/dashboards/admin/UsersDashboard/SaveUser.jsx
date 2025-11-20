import { BACKEND_ROUTES_API } from "../../../../config/config";

export async function saveUser({
  //these are the props that are passed to the function
  event,
  formData,
  setIsSubmitting,
  setSaveSuccess,
  setErrors,
  setUsers,
  setFormData,
  setShowAddModal,
  setError,
}) {
  event.preventDefault();
  setIsSubmitting(true);
  setSaveSuccess(false);

  // Final validation before submission:
  const newErrors = {};
  if (!formData.username)
    newErrors.username = "Το όνομα χρήστη είναι υποχρεωτικό";
  if (!formData.email) newErrors.email = "Το email είναι υποχρεωτικό";
  if (!formData.password) newErrors.password = "Ο κωδικός είναι υποχρεωτικός";
  if (formData.password !== formData.confpassword)
    newErrors.confpassword = "Οι κωδικοί δεν ταιριάζουν";

  // If there are validation errors, update state and stop submission
  if (Object.keys(newErrors).length > 0) {
    setErrors((prev) => ({
      ...prev, // Spread existing errors
      ...newErrors, // Add new errors
    }));
    setIsSubmitting(false);
    return;
  }

  // Format birthday and registration date

  const today = new Date();
  const registrationDate = Math.floor(today.getTime() / 1000);

  // Prepare data for API
  const dataToSend = {
    username: formData.username,
    email: formData.email,
    password: formData.password,
    registrationDate: registrationDate,
    role: formData.role,
    isverified: 1,
  };

  console.log("Data to send:", dataToSend);

  try {
    const response = await fetch(BACKEND_ROUTES_API + "AddUser.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(dataToSend),
    });
    const data = await response.json();

    if (data.success === true) {
      setSaveSuccess(true);
      setError(null); // Clear any existing errors

      setUsers((prev) => [
        ...prev,
        {
          id: data.UserID,
          username: formData.username,
          email: formData.email,
          registrationDate: registrationDate,
          role: formData.role,
          isverified: 1,
          registrationdate: Math.floor(new Date().getTime() / 1000),
        },
      ]);

      // Clear form data and errors
      setFormData({
        username: "",
        email: "",
        password: "",
        confpassword: "",
        role: "3",
      });

      // Close modal
      setShowAddModal(false);
      //clear errors
      setErrors({});
      // clear form data
      setFormData({
        username: "",
        email: "",
        password: "",
        confpassword: "",
        role: "3",
      });

      // Remove success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } else if (data.success === false) {
      setShowAddModal(false);
      // Close modal
      setShowAddModal(false);
      //clear errors
      setErrors({});
      // clear form data
      setFormData({
        username: "",
        email: "",
        password: "",
        confpassword: "",
        role: "3",
      });

      setError(data.message || "Registration failed");
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
    setError("An error occurred during registration. Please try again.");
    setShowAddModal(false);
  } finally {
    setIsSubmitting(false);
  }
}
