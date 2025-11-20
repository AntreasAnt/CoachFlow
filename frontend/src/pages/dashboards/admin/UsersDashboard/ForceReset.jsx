import { BACKEND_ROUTES_API } from '../../../../config/config';

export async function forceReset({ selectedUsers, setError, setShowActionsModal,setResetSuccess }) {
  try {
    const response = await fetch(`${BACKEND_ROUTES_API}ForceResetPassword.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userIds: selectedUsers }),
    });

    const data = await response.json();

    if (data.success) {
     setResetSuccess(true);

     //close after 3 seconds
        setTimeout(() => {
        setResetSuccess(false);
        }, 3000);
      
    } else {
      setError(data.message || "Αποτυχία επαναφοράς κωδικών.");

      setTimeout(()=>{setError(false)}, 8000);
    }
  } catch (error) {
    setError(error.message || "Παρουσιάστηκε σφάλμα κατά την επαναφορά κωδικών.");
    setTimeout(()=>{setError(false)}, 8000);
  } finally {
    setShowActionsModal(false);
  }
}