export const STARTER_CODE = `# Two Sum
# Find two indices whose values add up to the target.

def two_sum(nums, target):
    seen = {}

    for index, number in enumerate(nums):
        complement = target - number

        if complement in seen:
            return [seen[complement], index]

        seen[number] = index

    return []


# Give it a try. What happens with a different target?
nums = [2, 7, 11, 15]
target = 9

print(two_sum(nums, target))
`
