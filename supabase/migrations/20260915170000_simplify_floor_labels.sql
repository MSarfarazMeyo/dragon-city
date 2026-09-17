-- Single mall branding: "Dragon City" only — drop "— 1F" / "— Food Court" suffixes.
update public.floors
set label = 'Dragon City',
    label_i18n = '{"zh":"Dragon City","en":"Dragon City","ar":"Dragon City"}'::jsonb
where sort_order = 0
   or label ilike '%1F%'
   or label ilike '%一楼%'
   or label = 'Dragon City — 1F';

update public.floors
set label = 'Dragon City',
    label_i18n = '{"zh":"Dragon City","en":"Dragon City","ar":"Dragon City"}'::jsonb
where label ilike '%food%'
   or label ilike '%餐厅%'
   or label = 'Dragon City — Food Court';
