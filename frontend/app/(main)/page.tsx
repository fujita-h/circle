import { Inter } from 'next/font/google';
import Link from 'next/link';
const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  const date = new Date();
  return (
    <>
      <div>Authenticated</div>
      <div>{date.toLocaleString()}</div>
      <div>
        <Link href={'/aaa'}>aaa</Link>
      </div>
      <div>
        <Link href={'/bbb'}>bbb</Link>
      </div>
      <div>
        <Link href={'/ccc'}>ccc</Link>
      </div>
      <div>
        <a href={'/xxx'}>xxx</a>
      </div>
      <div>
        <a href={'/xxx/yyy'}>xxx/yyy</a>
      </div>
      <div>
        <Link href={'/'}>ROOT</Link>
      </div>
    </>
  );
}
