import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

const fontFamilies = {
    thin: 'Poppins_100Thin',
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
};

interface ThemedTextProps extends TextProps {
    weight?: keyof typeof fontFamilies;
    className?: string;
}

const Text: React.FC<ThemedTextProps> = ({
    style,
    children,
    weight = 'regular',
    className,
    ...props
}) => {
    const fontFamily = fontFamilies[weight] || fontFamilies.regular;

    return (
        <RNText style={[style, { fontFamily }]} {...props} className={className}>
            {children}
        </RNText>
    );
};

export default Text;
