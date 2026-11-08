export const STARTER_CODE = `def two_sum(nums, target):
    # Try every pair of different positions.
    for i in range(len(nums)):
        for j in range(len(nums)):
            if i != j and nums[i] + nums[j] == target:
                return [i, j]
    return []
numbers = [1, 2, 3]
x = two_sum(numbers, 3)
print(x)
`
