// next
import { useSession } from 'next-auth/react';

const useUser = () => {
  const { data: session } = useSession();
 // console.log( useSession())
  if (session) {
    const user = session?.user;
    let thumb = user?.image;

    if (!user?.image) {
      user.image = '/assets/images/users/avatar-1.png';
      thumb = '/assets/images/users/avatar-thumb-1.png';
    }

    const newUser = {
      name: user.name,
      email: user.email,
      avatar: user?.image,
      thumb,
      role: 'UI/UX '
    };

    return newUser;
  }
  return false;
};

export default useUser;
