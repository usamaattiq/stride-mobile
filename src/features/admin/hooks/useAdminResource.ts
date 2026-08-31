import React from 'react';
import { useFocusEffect } from '@react-navigation/native';

type UseAdminResourceOptions<T> = {
  load: () => Promise<T>;
  /** When these change, data is reloaded. Do not include `t` or language deps. */
  deps?: React.DependencyList;
  reloadOnFocus?: boolean;
};

type UseAdminResourceResult<T> = {
  data: T | null;
  loading: boolean;
  errorKey: string | null;
  reload: () => Promise<void>;
};

export function useAdminResource<T>({
  load,
  deps = [],
  reloadOnFocus = false,
}: UseAdminResourceOptions<T>): UseAdminResourceResult<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const loadRef = React.useRef(load);
  const hasDataRef = React.useRef(false);
  loadRef.current = load;

  const reload = React.useCallback(async () => {
    setErrorKey(null);
    try {
      const result = await loadRef.current();
      setData(result);
      hasDataRef.current = true;
    } catch {
      setErrorKey('admin.common.loadFailed');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!hasDataRef.current) {
      setLoading(true);
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are caller-controlled reload triggers only
  }, [reload, ...deps]);

  useFocusEffect(
    React.useCallback(() => {
      if (!reloadOnFocus) {
        return;
      }
      void reload();
    }, [reload, reloadOnFocus]),
  );

  return { data, loading, errorKey, reload };
}
