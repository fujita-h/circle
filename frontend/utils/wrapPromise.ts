export const wrapPromise = (promise: Promise<any>) => {
  let status = 'pending';
  let result: any;

  const suspender = promise.then(
    (r: any) => {
      status = 'fulfilled';
      result = r;
    },
    (e: any) => {
      status = 'rejected';
      result = e;
    },
  );

  const read = () => {
    if (status === 'pending') {
      throw suspender;
    } else if (status === 'rejected') {
      throw result;
    } else {
      return result;
    }
  };

  return { read };
};
