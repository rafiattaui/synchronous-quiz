interface IAdminGrid {
  nextState: () => void;
}

import {
  Anchor,
  Card,
  Group,
  SimpleGrid,
  Text,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { ArrowBigRight } from 'lucide-react';
import classes from '@/components/AdminGrid.module.css';

const mockdata = [{ title: 'Next State', icon: ArrowBigRight, color: 'green' }];

export function AdminGrid({ nextState }: IAdminGrid) {
  const theme = useMantineTheme();

  const items = mockdata.map((item) => (
    <UnstyledButton
      key={item.title}
      className={classes.item}
      onClick={nextState}
    >
      <item.icon color={theme.colors[item.color][6]} size={32} />
      <Text size="xs" mt={7}>
        {item.title}
      </Text>
    </UnstyledButton>
  ));

  return (
    <Card withBorder radius="md" className={classes.card}>
      <Group justify="space-between">
        <Text className={classes.title}>Admin Actions</Text>
        <Anchor c="inherit" size="xs"></Anchor>
      </Group>
      <SimpleGrid cols={3} mt="md">
        {items}
      </SimpleGrid>
    </Card>
  );
}
