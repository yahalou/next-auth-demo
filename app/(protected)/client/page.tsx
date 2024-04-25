"use client";
import UserInfo from "@/components/user-info";
import { useCurrentUser } from "@/hooks/use-current-user";

// 当然也可以使用 server action，就是有点麻烦，所以为啥叫server action呢，只用调用执行action，不用拿回数据，常在onClick等中调用
// 见NewVerificationForm函数

const ClientPage = () => {
  const user = useCurrentUser();
  return <UserInfo user={user} label="Client component" />;
};

export default ClientPage;
