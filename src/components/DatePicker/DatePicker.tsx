/** Trigger + Calendar in a modal, bottom sheet or inline popover. Single date (v1). */
import { format } from 'date-fns';
import { View } from 'react-native';
import { toZoned } from '../../core/dateUtils';
import { useControllableState } from '../../hooks/useControllableState';
import { useDateValue } from '../../hooks/useDateValue';
import { SHADOW } from '../../platform/styles';
import { cn } from '../../theme/cn';
import { useDatePickerTheme } from '../../theme/DatePickerThemeProvider';
import type { DatePickerProps } from '../../types';
import { Calendar } from '../Calendar/Calendar';
import { pickCalendarPassthrough } from '../shared/passthrough';
import { DefaultTrigger } from './DefaultTrigger';
import { Overlay } from './Overlay';

export function DatePicker(props: DatePickerProps) {
  const {
    presentation = 'modal',
    placeholder = 'Select date',
    displayFormat = 'PP',
    closeOnSelect = true,
    renderTrigger,
    locale,
    timeZone,
    hapticFeedback = true,
    themeOverride,
    className,
    classNames,
    testID = 'date-picker',
  } = props;

  const { rootStyle } = useDatePickerTheme(themeOverride);
  const [value, setValue] = useDateValue(props);
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });

  const displayValue = value ? format(toZoned(value, timeZone), displayFormat, { locale }) : null;
  const open = () => setOpen(true);
  const close = () => setOpen(false);

  const onSelect = (date: Date) => {
    setValue(date);
    if (closeOnSelect) close();
  };

  const calendar = (
    <Calendar
      {...pickCalendarPassthrough(props)}
      mode="single"
      value={value}
      onChange={onSelect}
      locale={locale}
      timeZone={timeZone}
      hapticFeedback={hapticFeedback}
      themeOverride={themeOverride}
      classNames={classNames?.calendar}
      testID={`${testID}-calendar`}
    />
  );

  return (
    <View style={rootStyle} className={cn('w-full', className, classNames?.container)} testID={testID}>
      {renderTrigger ? (
        renderTrigger({ isOpen, value, displayValue, open, close })
      ) : (
        <DefaultTrigger
          displayValue={displayValue}
          placeholder={placeholder}
          isOpen={isOpen}
          onPress={isOpen ? close : open}
          classNames={classNames}
          testID={testID}
        />
      )}

      {presentation === 'popover' ? (
        isOpen && (
          <View
            testID={`${testID}-popover`}
            style={SHADOW}
            className={cn('mt-2 rounded-lg border border-border bg-background', classNames?.popover)}
          >
            {calendar}
          </View>
        )
      ) : (
        <Overlay
          visible={isOpen}
          variant={presentation}
          onRequestClose={close}
          rootStyle={rootStyle}
          classNames={classNames}
          testID={testID}
        >
          {calendar}
        </Overlay>
      )}
    </View>
  );
}
