type PersonDisplayFields = {
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  pronouns?: string | null;
};

type PersonDisplayOptions = {
  includePreferredName?: boolean;
  usePreferredName?: boolean;
};

export const formatPersonDisplayName = (
  person: PersonDisplayFields,
  options: PersonDisplayOptions = {},
) => {
  const preferredName = person.preferred_name?.trim();
  const firstName =
    options.usePreferredName && preferredName
      ? preferredName
      : person.first_name;
  const preferredNameSuffix =
    options.includePreferredName && preferredName ? ` (${preferredName})` : '';
  const pronouns = person.pronouns?.trim();

  return `${firstName}${preferredNameSuffix} ${person.last_name}${pronouns ? ` (${pronouns})` : ''}`;
};
