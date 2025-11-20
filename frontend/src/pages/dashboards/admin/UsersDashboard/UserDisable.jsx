import { BACKEND_ROUTES_API } from '../../../../config/config';

export async function userDisable({ selectedUsers, setError, setShowActionsModal,setDisableSuccess,setUsers }) {
  try {
    const response = await fetch(`${BACKEND_ROUTES_API}UserDisable.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userIds: selectedUsers }),
    });

    const data = await response.json();

    if (data.success) {
        setDisableSuccess(true);

          //add the disable on user=1
          setUsers((prev) =>
            prev.map((user) =>
              selectedUsers.includes(user.id)
                ? {
                    ...user,
                    isdisabled:1
                  }
                : user
            )
          );

     //close after 3 seconds
        setTimeout(() => {
            setDisableSuccess(false);
        }, 3000);
      
    } else {


        if (data.successDisable) {
         
          const successDisableIds = data.successDisable
            .split(',')
            .map((id) => parseInt(id.trim(), 10));
      
          setUsers((prev) =>
            prev.map((user) =>
              successDisableIds.includes(user.id)
                ? {
                    ...user,
                    isdisabled: 1
                  }
                : user
            )
          );

          setDisableSuccess(true);
      
          //close after 3 seconds
             setTimeout(() => {
              setDisableSuccess(false);
             }, 3000);

        }else{
          setError(data.message || "Αποτυχία απενεργοποίησης.");
          setTimeout(()=>{setError(false)}, 8000);
        }




    }
  } catch (error) {
    setError(error.message || "Παρουσιάστηκε σφάλμα .");
    setTimeout(()=>{setError(false)}, 8000);
  } finally {
    setShowActionsModal(false);
  }
}