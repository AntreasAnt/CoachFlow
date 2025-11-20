import { BACKEND_ROUTES_API } from '../../../../config/config';

export async function userEnable({ selectedUsers, setError, setShowActionsModal,setEnableSuccess, setUsers }) {
  try {
    const response = await fetch(`${BACKEND_ROUTES_API}UserEnable.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userIds: selectedUsers }),
    });

    const data = await response.json();
      //All users enabled
    if (data.success) {
        setEnableSuccess(true);

          //add the disable on user=1
          setUsers((prev) => // Takes previous state as argument
            prev.map((user) =>// Maps over all users
              selectedUsers.includes(user.id) // Checks if user is selected
                ? {
                    ...user,// Spread existing user properties
                    isdisabled:0   // Set isdisabled to 0 (enable user)
                  }
                : user// If not selected: keep unchanged
            )
          );

     //close after 3 seconds
        setTimeout(() => {
            setEnableSuccess(false);
        }, 3000);
      
    }

     else {
         //Some users enabled
        if (data.successEnable) {
            //we receive from the backend a string of ids and we split them to display the success message
            const successEnableIds = data.successEnable
              .split(',')
              .map((id) => parseInt(id.trim(), 10));
        
            setUsers((prev) =>
              prev.map((user) =>
                successEnableIds.includes(user.id)
                  ? {
                      ...user,
                      isdisabled: 0
                    }
                  : user
              )
            );
          
              setEnableSuccess(true);
      
           //close after 3 seconds
              setTimeout(() => {
                  setEnableSuccess(false);
              }, 3000);
            
          }else {setError(data.message || "Αποτυχία ενεργοποίησης.");
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