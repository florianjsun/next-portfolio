import { Icons } from "@/components/common/icons";

interface SocialInterface {
  name: string;
  username: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
}

export const SocialLinks: SocialInterface[] = [
  {
    name: "Github",
    username: "@florianjsun",
    icon: Icons.gitHub,
    link: "https://github.com/florianjsun",
  },
  {
    name: "LinkedIn",
    username: "Sun Jing",
    icon: Icons.linkedin,
    link: "https://www.linkedin.com/in/sun-jing/",
  },
  {
    name: "Twitter",
    username: "@florianjsun",
    icon: Icons.twitter,
    link: "https://twitter.com/florianjsun",
  },
  {
    name: "Gmail",
    username: "florianjsun",
    icon: Icons.gmail,
    link: "mailto:florianjsun@gmail.com",
  },
];
