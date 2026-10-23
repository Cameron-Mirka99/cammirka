import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllUsers, updateUser } from "@/lib/api/users";
import { queryKeys } from "./keys";

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => (await fetchAllUsers()).users,
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.adminUsers }),
  });
}
