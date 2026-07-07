import React, { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

type CategoryLike = {
  id: number;
  name: string;
};

type SkillAreaLike = {
  id: number;
  name: string;
  category_id: number;
  category?: { name: string } | null;
};

type CategoryFilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  categories?: CategoryLike[];
  placeholder?: string;
};

type SkillAreaFilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  skillAreas?: SkillAreaLike[];
  categories?: CategoryLike[];
  categoryId?: string;
  allowedSkillAreaIds?: Set<number>;
  placeholder?: string;
};

type SkillAreaNameFilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  skillAreas?: string[];
  allValue?: string;
  placeholder?: string;
};

type CategorySkillAreaFiltersProps = {
  categoryId: string;
  onCategoryChange: (value: string) => void;
  skillAreaId: string;
  onSkillAreaChange: (value: string) => void;
  categories?: CategoryLike[];
  skillAreas?: SkillAreaLike[];
  allowedSkillAreaIds?: Set<number>;
  categoryPlaceholder?: string;
  skillAreaPlaceholder?: string;
  categoryClassName?: string;
  skillAreaClassName?: string;
};

export const CategoryFilterSelect: React.FC<CategoryFilterSelectProps> = ({
  value,
  onChange,
  categories,
  placeholder = 'All categories',
}) => {
  const options = useMemo(
    () => (categories ?? []).map(category => ({ value: String(category.id), label: category.name })),
    [categories],
  );

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
    />
  );
};

export const SkillAreaFilterSelect: React.FC<SkillAreaFilterSelectProps> = ({
  value,
  onChange,
  skillAreas,
  categories,
  categoryId,
  allowedSkillAreaIds,
  placeholder = 'All skill areas',
}) => {
  const options = useMemo(
    () => (skillAreas ?? [])
      .filter(skillArea => !categoryId || String(skillArea.category_id) === categoryId)
      .filter(skillArea => !allowedSkillAreaIds || allowedSkillAreaIds.has(skillArea.id))
      .map(skillArea => ({
        value: String(skillArea.id),
        label: skillArea.name,
        sub: skillArea.category?.name ?? categories?.find(category => category.id === skillArea.category_id)?.name,
      })),
    [allowedSkillAreaIds, categories, categoryId, skillAreas],
  );

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
    />
  );
};

export const SkillAreaNameFilterSelect: React.FC<SkillAreaNameFilterSelectProps> = ({
  value,
  onChange,
  skillAreas,
  allValue = 'all',
  placeholder = 'All skill areas',
}) => {
  const options = useMemo(
    () => (skillAreas ?? []).filter(Boolean).map(skillArea => ({ value: skillArea, label: skillArea })),
    [skillAreas],
  );

  return (
    <SearchableSelect
      value={value === allValue ? '' : value}
      onChange={(nextValue) => onChange(nextValue || allValue)}
      placeholder={placeholder}
      options={options}
    />
  );
};

export const CategorySkillAreaFilters: React.FC<CategorySkillAreaFiltersProps> = ({
  categoryId,
  onCategoryChange,
  skillAreaId,
  onSkillAreaChange,
  categories,
  skillAreas,
  allowedSkillAreaIds,
  categoryPlaceholder = 'All categories',
  skillAreaPlaceholder = 'All skill areas',
  categoryClassName,
  skillAreaClassName,
}) => {
  const handleCategoryChange = (nextCategoryId: string) => {
    onCategoryChange(nextCategoryId);

    const selectedSkillArea = (skillAreas ?? []).find(skillArea => String(skillArea.id) === skillAreaId);
    const blockedByCategory = nextCategoryId && selectedSkillArea && String(selectedSkillArea.category_id) !== nextCategoryId;
    const blockedByAllowance = selectedSkillArea && allowedSkillAreaIds && !allowedSkillAreaIds.has(selectedSkillArea.id);
    if (blockedByCategory || blockedByAllowance) {
      onSkillAreaChange('');
    }
  };

  return (
    <>
      <div className={categoryClassName}>
        <CategoryFilterSelect
          value={categoryId}
          onChange={handleCategoryChange}
          categories={categories}
          placeholder={categoryPlaceholder}
        />
      </div>
      <div className={skillAreaClassName}>
        <SkillAreaFilterSelect
          value={skillAreaId}
          onChange={onSkillAreaChange}
          skillAreas={skillAreas}
          categories={categories}
          categoryId={categoryId}
          allowedSkillAreaIds={allowedSkillAreaIds}
          placeholder={skillAreaPlaceholder}
        />
      </div>
    </>
  );
};
